from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app import models, schemas
from app.auth import require_role

router = APIRouter(prefix="/wishlists", tags=["Wishlist"])

@router.get("", response_model=List[schemas.WishlistOut])
def get_user_wishlist(
    db: Session = Depends(get_db),
    buyer: models.User = Depends(require_role(["buyer", "admin"]))
):
    items = db.query(models.Wishlist).filter(models.Wishlist.buyer_id == buyer.id).order_by(desc(models.Wishlist.created_at)).all()
    results = []
    for item in items:
        out = schemas.WishlistOut.model_validate(item)
        if item.property:
            out.property = schemas.PropertyOut.model_validate(item.property)
        results.append(out)
    return results


@router.post("/{property_id}", response_model=schemas.WishlistOut, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    property_id: int,
    db: Session = Depends(get_db),
    buyer: models.User = Depends(require_role(["buyer", "admin"]))
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    existing = db.query(models.Wishlist).filter(
        models.Wishlist.buyer_id == buyer.id,
        models.Wishlist.property_id == property_id
    ).first()

    if existing:
        out = schemas.WishlistOut.model_validate(existing)
        out.property = schemas.PropertyOut.model_validate(prop)
        return out

    wish = models.Wishlist(buyer_id=buyer.id, property_id=property_id)
    db.add(wish)
    db.commit()
    db.refresh(wish)

    out = schemas.WishlistOut.model_validate(wish)
    out.property = schemas.PropertyOut.model_validate(prop)
    return out


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    property_id: int,
    db: Session = Depends(get_db),
    buyer: models.User = Depends(require_role(["buyer", "admin"]))
):
    wish = db.query(models.Wishlist).filter(
        models.Wishlist.buyer_id == buyer.id,
        models.Wishlist.property_id == property_id
    ).first()
    if wish:
        db.delete(wish)
        db.commit()
    return None
