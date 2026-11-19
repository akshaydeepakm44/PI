from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_role

router = APIRouter(tags=["Enquiries"])

@router.post("/enquiries", response_model=schemas.EnquiryOut, status_code=status.HTTP_201_CREATED)
def submit_enquiry(
    enquiry_in: schemas.EnquiryCreate,
    db: Session = Depends(get_db),
    buyer: models.User = Depends(require_role(["buyer", "admin"]))
):
    prop = db.query(models.Property).filter(models.Property.id == enquiry_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Target property listing not found")

    if prop.status != "published" and buyer.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot submit enquiry for unpublished property")

    enquiry = models.Enquiry(
        property_id=prop.id,
        buyer_id=buyer.id,
        buyer_name=enquiry_in.buyer_name or buyer.full_name,
        buyer_email=enquiry_in.buyer_email or buyer.email,
        buyer_phone=enquiry_in.buyer_phone,
        message=enquiry_in.message,
        status="pending"
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    # Log audit entry
    audit = models.AuditLog(
        user_id=buyer.id,
        action="ENQUIRY_SUBMITTED",
        target_type="Enquiry",
        target_id=enquiry.id,
        details=f"Buyer submitted enquiry for property {prop.name}"
    )
    db.add(audit)
    db.commit()

    res = schemas.EnquiryOut.model_validate(enquiry)
    res.property_name = prop.name
    return res


@router.get("/buyer/enquiries", response_model=List[schemas.EnquiryOut])
def get_buyer_enquiries(
    db: Session = Depends(get_db),
    buyer: models.User = Depends(require_role(["buyer", "admin"]))
):
    enquiries = db.query(models.Enquiry).filter(models.Enquiry.buyer_id == buyer.id).order_by(desc(models.Enquiry.created_at)).all()
    results = []
    for enq in enquiries:
        item = schemas.EnquiryOut.model_validate(enq)
        if enq.property:
            item.property_name = enq.property.name
        results.append(item)
    return results


@router.get("/seller/enquiries", response_model=List[schemas.EnquiryOut])
def get_seller_enquiries(
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    if seller.role == "admin":
        enquiries = db.query(models.Enquiry).order_by(desc(models.Enquiry.created_at)).all()
    else:
        # Get enquiries for properties owned by this seller
        props = db.query(models.Property).filter(models.Property.seller_id == seller.id).all()
        prop_ids = [p.id for p in props]
        enquiries = db.query(models.Enquiry).filter(models.Enquiry.property_id.in_(prop_ids)).order_by(desc(models.Enquiry.created_at)).all()

    results = []
    for enq in enquiries:
        item = schemas.EnquiryOut.model_validate(enq)
        if enq.property:
            item.property_name = enq.property.name
        results.append(item)
    return results


@router.post("/seller/enquiries/{enquiry_id}/reply", response_model=schemas.EnquiryOut)
def reply_to_enquiry(
    enquiry_id: int,
    reply_data: schemas.EnquiryReply,
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    prop = db.query(models.Property).filter(models.Property.id == enquiry.property_id).first()
    if not prop or (prop.seller_id != seller.id and seller.role != "admin"):
        raise HTTPException(status_code=403, detail="You do not have permission to reply to this enquiry")

    enquiry.seller_reply = reply_data.reply
    enquiry.status = "responded"
    db.commit()
    db.refresh(enquiry)

    audit = models.AuditLog(
        user_id=seller.id,
        action="ENQUIRY_RESPONDED",
        target_type="Enquiry",
        target_id=enquiry.id,
        details=f"Seller replied to enquiry for property {prop.name}"
    )
    db.add(audit)
    db.commit()

    res = schemas.EnquiryOut.model_validate(enquiry)
    res.property_name = prop.name
    return res
