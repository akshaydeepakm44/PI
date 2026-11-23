from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_role, get_current_user_optional
from app.services.pipeline import run_property_research
from app.routers.feature_intelligence import async_precompute_property_intelligence, db_feature_cache

router = APIRouter(tags=["Properties"])

# --- PUBLIC DIRECTORY ENDPOINTS ---

@router.get("/properties", response_model=List[schemas.PropertyOut])
def list_published_properties(
    search: Optional[str] = Query(None, description="Search by name, locality, address"),
    property_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    construction_status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("newest", description="newest, price_asc, price_desc, area_asc, area_desc"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Property).filter(models.Property.status != "suspended")

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Property.name.ilike(s),
                models.Property.locality.ilike(s),
                models.Property.address.ilike(s),
                models.Property.city.ilike(s)
            )
        )

    if property_type and property_type != "All":
        query = query.filter(models.Property.property_type == property_type)

    if city:
        query = query.filter(models.Property.city.ilike(f"%{city}%"))

    if min_price is not None:
        query = query.filter(models.Property.total_price >= min_price)

    if max_price is not None:
        query = query.filter(models.Property.total_price <= max_price)

    if min_area is not None:
        query = query.filter(models.Property.area >= min_area)

    if max_area is not None:
        query = query.filter(models.Property.area <= max_area)

    if construction_status and construction_status != "All":
        query = query.filter(models.Property.construction_status == construction_status)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(asc(models.Property.total_price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(models.Property.total_price))
    elif sort_by == "area_asc":
        query = query.order_by(asc(models.Property.area))
    elif sort_by == "area_desc":
        query = query.order_by(desc(models.Property.area))
    else:
        query = query.order_by(desc(models.Property.created_at))

    return query.all()


@router.get("/properties/{property_id}", response_model=schemas.PropertyOut)
def get_property_detail(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property listing not found")

    # If draft or suspended, only the owner seller or admin can view it
    if prop.status != "published":
        if not current_user or (current_user.id != prop.seller_id and current_user.role != "admin"):
            raise HTTPException(status_code=403, detail="This listing is currently in draft or under review")

    # Increment view count
    prop.views_count = (prop.views_count or 0) + 1
    db.commit()
    db.refresh(prop)

    return prop


# --- SELLER WORKSPACE ENDPOINTS ---

@router.post("/properties", response_model=schemas.PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    prop_in: schemas.PropertyCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    # Enforce seller provided / unverified rule
    new_prop = models.Property(
        seller_id=seller.id,
        name=prop_in.name,
        property_type=prop_in.property_type,
        state=prop_in.state,
        district=prop_in.district,
        city=prop_in.city,
        locality=prop_in.locality,
        address=prop_in.address,
        latitude=prop_in.latitude,
        longitude=prop_in.longitude,
        area=prop_in.area,
        area_unit=prop_in.area_unit,
        road_access_m=prop_in.road_access_m,
        frontage_m=prop_in.frontage_m,
        survey_number=prop_in.survey_number,
        boundary_geojson=prop_in.boundary_geojson,
        asking_price=prop_in.asking_price,
        price_unit=prop_in.price_unit,
        total_price=prop_in.total_price,
        payment_terms=prop_in.payment_terms,
        additional_charges=prop_in.additional_charges,
        maintenance_charges=prop_in.maintenance_charges,
        availability_date=prop_in.availability_date,
        description=prop_in.description,
        amenities=prop_in.amenities,
        utilities=prop_in.utilities,
        floors=prop_in.floors,
        towers=prop_in.towers,
        unit_count=prop_in.unit_count,
        construction_status=prop_in.construction_status,
        photos=prop_in.photos,
        site_plan_url=prop_in.site_plan_url,
        brochure_url=prop_in.brochure_url,
        survey_sketch_url=prop_in.survey_sketch_url,
        documents=prop_in.documents,
        seller_name=prop_in.seller_name or seller.full_name,
        seller_contact=prop_in.seller_contact or seller.email,
        possession_date=prop_in.possession_date,
        developer_profile=prop_in.developer_profile,
        verification_status="Seller provided / Unverified",
        status=prop_in.status if prop_in.status in ["draft", "published"] else "draft",
        is_demo=False
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)

    # Register research job
    job = models.ResearchJob(
        property_id=new_prop.id,
        job_type="Spatial Context & Location Intelligence",
        status="queued",
        result_summary="Location research queued for background execution."
    )
    db.add(job)

    # Log audit entry
    audit = models.AuditLog(
        user_id=seller.id,
        action="PROPERTY_CREATED",
        target_type="Property",
        target_id=new_prop.id,
        details=f"Created {new_prop.name} with status {new_prop.status}"
    )
    db.add(audit)
    db.commit()

    # Trigger authentic research pipeline and precompute feature intelligence in the background
    background_tasks.add_task(run_property_research, new_prop.id)
    background_tasks.add_task(async_precompute_property_intelligence, new_prop.id)

    return new_prop


@router.put("/properties/{property_id}", response_model=schemas.PropertyOut)
def update_property(
    property_id: int,
    prop_in: schemas.PropertyUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Permissions check: only owner or admin can edit
    if prop.seller_id != seller.id and seller.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to edit this property")

    update_data = prop_in.model_dump(exclude_unset=True)

    # Permission guard: sellers cannot un-suspend a listing without admin approval
    if seller.role != "admin":
        if prop.status == "suspended" and update_data.get("status") == "published":
            raise HTTPException(status_code=403, detail="Cannot publish a suspended listing without administrative review")
        if update_data.get("status") == "suspended":
            raise HTTPException(status_code=403, detail="Only administrators can suspend listings")
        # Ensure non-admin sellers can only choose between draft and published
        if "status" in update_data and update_data["status"] not in ["draft", "published"]:
            raise HTTPException(status_code=400, detail="Invalid status value for seller")

    coords_changed = (
        ("latitude" in update_data and update_data["latitude"] != prop.latitude) or
        ("longitude" in update_data and update_data["longitude"] != prop.longitude)
    )
    published_now = update_data.get("status") == "published" and prop.status != "published"

    for field, value in update_data.items():
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)

    # Log audit entry
    audit = models.AuditLog(
        user_id=seller.id,
        action="PROPERTY_UPDATED",
        target_type="Property",
        target_id=prop.id,
        details=f"Updated property {prop.name}"
    )
    db.add(audit)
    db.commit()

    # Re-run research pipeline if coordinates changed or newly published
    if coords_changed:
        existing_research = db.query(models.PropertyResearch).filter(
            models.PropertyResearch.property_id == prop.id
        ).first()
        if existing_research:
            existing_research.status = "stale"
        
        # Mark all prior intelligence reports stale since spatial context changed
        db.query(models.PropertyIntelligenceReport).filter(
            models.PropertyIntelligenceReport.property_id == prop.id
        ).update({"is_stale": True})
        db.commit()

    if coords_changed or published_now:
        background_tasks.add_task(run_property_research, prop.id)

    # Invalidate old cache and precompute updated intelligence in background
    db_feature_cache.invalidate_property(db, prop.id)
    background_tasks.add_task(async_precompute_property_intelligence, prop.id)

    return prop


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    if prop.seller_id != seller.id and seller.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to delete this property")

    prop_id = prop.id
    prop_name = prop.name
    db.delete(prop)
    
    audit = models.AuditLog(
        user_id=seller.id,
        action="PROPERTY_DELETED",
        target_type="Property",
        target_id=prop_id,
        details=f"Deleted listing {prop_name}"
    )
    db.add(audit)
    db.commit()
    return None


@router.get("/seller/properties", response_model=List[schemas.PropertyOut])
def list_seller_properties(
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    if seller.role == "admin":
        return db.query(models.Property).order_by(desc(models.Property.created_at)).all()
    return db.query(models.Property).filter(models.Property.seller_id == seller.id).order_by(desc(models.Property.created_at)).all()


@router.get("/seller/analytics")
def get_seller_analytics(
    db: Session = Depends(get_db),
    seller: models.User = Depends(require_role(["seller", "admin"]))
):
    props = db.query(models.Property).filter(models.Property.seller_id == seller.id).all()
    prop_ids = [p.id for p in props]
    
    total_views = sum(p.views_count or 0 for p in props)
    total_listings = len(props)
    published_count = len([p for p in props if p.status == "published"])
    draft_count = len([p for p in props if p.status == "draft"])
    
    enquiries_count = db.query(models.Enquiry).filter(models.Enquiry.property_id.in_(prop_ids)).count() if prop_ids else 0

    return {
        "total_listings": total_listings,
        "published_listings": published_count,
        "draft_listings": draft_count,
        "total_views": total_views,
        "total_enquiries": enquiries_count,
        "listings_breakdown": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "views": p.views_count,
                "price": p.asking_price
            }
            for p in props
        ]
    }
