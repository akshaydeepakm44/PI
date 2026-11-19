import logging
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user_optional
from app.services.pipeline import run_property_research
from app.services.evidence import build_property_evidence_layer
from app.services.ai_analyst import generate_property_intelligence_report
from app.services.comparator import compare_properties_evidence

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/intelligence", tags=["Location & AI Property Intelligence"])

@router.get("/properties/{property_id}")
def get_property_intelligence(
    property_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns authentic, evidence-backed location intelligence for a property.
    Includes nearby amenities (Overpass), air quality (Open-Meteo), and road connectivity (OSRM).
    If research has not yet run or is stale, executes the pipeline and returns the findings.
    """
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    research = db.query(models.PropertyResearch).filter(
        models.PropertyResearch.property_id == property_id
    ).first()

    # If no research exists or status is queued, failed, or stale, run pipeline on demand
    if not research or research.status in ["queued", "failed", "stale"]:
        run_property_research(property_id, db=db)
        research = db.query(models.PropertyResearch).filter(
            models.PropertyResearch.property_id == property_id
        ).first()

    if not research:
        raise HTTPException(status_code=500, detail="Unable to retrieve location intelligence")

    return {
        "property_id": prop.id,
        "property_name": prop.name,
        "coordinates": {"lat": prop.latitude, "lon": prop.longitude},
        "status": research.status,
        "last_researched_at": research.last_researched_at.isoformat() if research.last_researched_at else None,
        "geocoding": research.geocoding_data,
        "nearby_pois": research.nearby_pois,
        "poi_summary": research.poi_summary,
        "air_quality": research.air_quality_data,
        "connectivity": research.connectivity_data,
        "source_metadata": research.source_metadata,
        "error_details": research.error_details,
        "disclaimer": "All spatial amenities and infrastructure are retrieved directly from OpenStreetMap and Open-Meteo Copernicus CAMS. Coverage varies by region; absence on map does not confirm non-existence."
    }

@router.post("/properties/{property_id}/refresh")
def refresh_property_intelligence(
    property_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Triggers an asynchronous refresh of location intelligence for a property.
    Marks any existing AI reports as stale.
    """
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Mark existing reports as stale
    db.query(models.PropertyIntelligenceReport).filter(
        models.PropertyIntelligenceReport.property_id == property_id
    ).update({"is_stale": True})
    db.commit()

    background_tasks.add_task(run_property_research, property_id)

    return {
        "status": "queued",
        "message": f"Location intelligence pipeline queued for {prop.name}",
        "property_id": property_id
    }

@router.get("/properties/{property_id}/evidence")
def get_property_evidence_layer(
    property_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns the complete structured evidence layer with stable IDs across
    Group A (Seller), Group B (Location), Group C (Environmental), Group D (Calculated),
    and Group E (Gaps & Uncertainties).
    """
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    research = db.query(models.PropertyResearch).filter(
        models.PropertyResearch.property_id == property_id
    ).first()

    evidence_layer = build_property_evidence_layer(prop, research, db)
    return evidence_layer

@router.get("/properties/{property_id}/report")
async def get_property_ai_report(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Retrieves the latest generated Property Intelligence Report.
    If no report exists or existing report is stale, automatically generates one.
    """
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check for latest active report
    report_record = db.query(models.PropertyIntelligenceReport).filter(
        models.PropertyIntelligenceReport.property_id == property_id,
        models.PropertyIntelligenceReport.is_stale == False
    ).order_by(models.PropertyIntelligenceReport.created_at.desc()).first()

    if report_record:
        return {
            "report_id": report_record.id,
            "property_id": prop.id,
            "property_name": prop.name,
            "status": report_record.status,
            "is_stale": report_record.is_stale,
            "model_name": report_record.model_name,
            "prompt_version": report_record.prompt_version,
            "created_at": report_record.created_at.isoformat(),
            "execution_time_ms": report_record.execution_time_ms,
            "token_usage": report_record.token_usage,
            "preferences_applied": report_record.preferences_snapshot,
            "evidence_snapshot": report_record.evidence_snapshot,
            "report": report_record.report_json
        }

    # If no report, generate fresh one
    return await generate_property_ai_report_action(property_id, schemas.GenerateReportRequest(), db, current_user)

@router.post("/properties/{property_id}/report/generate")
async def generate_property_ai_report_endpoint(
    property_id: int,
    request: schemas.GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Explicitly triggers generation or refresh of the evidence-grounded
    Property Intelligence Report with optional buyer-personalized criteria.
    """
    return await generate_property_ai_report_action(property_id, request, db, current_user)

async def generate_property_ai_report_action(
    property_id: int,
    request: schemas.GenerateReportRequest,
    db: Session,
    current_user: Optional[models.User]
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    research = db.query(models.PropertyResearch).filter(
        models.PropertyResearch.property_id == property_id
    ).first()

    if not research or research.status in ["queued", "failed", "stale"]:
        run_property_research(property_id, db=db)
        research = db.query(models.PropertyResearch).filter(
            models.PropertyResearch.property_id == property_id
        ).first()

    prefs_dict = request.buyer_preferences.model_dump() if request.buyer_preferences else None

    # Build structured evidence layer
    evidence_layer = build_property_evidence_layer(prop, research, db, prefs_dict)

    # Call AI Engine (with deterministic validator & fallback)
    ai_output = await generate_property_intelligence_report(evidence_layer, prefs_dict)

    # Mark old reports stale
    db.query(models.PropertyIntelligenceReport).filter(
        models.PropertyIntelligenceReport.property_id == property_id
    ).update({"is_stale": True})

    # Persist report to database
    report_record = models.PropertyIntelligenceReport(
        property_id=prop.id,
        buyer_id=current_user.id if current_user else None,
        research_version=f"v2-{research.last_researched_at.strftime('%Y%m%d%H%M%S') if research and research.last_researched_at else 'unr'}",
        prompt_version=ai_output["prompt_version"],
        model_name=ai_output["model_name"],
        evidence_snapshot=evidence_layer,
        preferences_snapshot=prefs_dict,
        report_json=ai_output["report"],
        status="completed",
        validation_status="valid" if ai_output["report"].get("evidence_citations_audit", {}).get("audit_pass") else "repaired",
        validation_notes=ai_output["report"].get("evidence_citations_audit"),
        execution_time_ms=ai_output["execution_time_ms"],
        token_usage=ai_output["token_usage"],
        is_stale=False
    )
    db.add(report_record)

    # Log audit entry
    audit = models.AuditLog(
        user_id=current_user.id if current_user else None,
        action="AI_REPORT_GENERATED",
        target_type="PropertyIntelligenceReport",
        target_id=prop.id,
        details=f"Generated report for {prop.name} via {ai_output['generation_source']} ({ai_output['execution_time_ms']}ms)"
    )
    db.add(audit)
    db.commit()
    db.refresh(report_record)

    return {
        "report_id": report_record.id,
        "property_id": prop.id,
        "property_name": prop.name,
        "status": report_record.status,
        "is_stale": report_record.is_stale,
        "model_name": report_record.model_name,
        "prompt_version": report_record.prompt_version,
        "created_at": report_record.created_at.isoformat(),
        "execution_time_ms": report_record.execution_time_ms,
        "token_usage": report_record.token_usage,
        "preferences_applied": prefs_dict,
        "evidence_snapshot": evidence_layer,
        "report": report_record.report_json
    }

@router.post("/compare")
def compare_properties_endpoint(
    request: schemas.ComparePropertiesRequest,
    db: Session = Depends(get_db)
):
    """
    Compares 2 to 4 properties side-by-side using structured evidence layers,
    topological OSRM road routes, and Copernicus CAMS environmental metrics.
    """
    try:
        prefs_dict = request.buyer_preferences.model_dump() if request.buyer_preferences else None
        result = compare_properties_evidence(request.property_ids, db, prefs_dict)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Property comparison failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
