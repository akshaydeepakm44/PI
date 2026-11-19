import time
import logging
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services.geocoding import reverse_geocode
from app.services.overpass import fetch_nearby_pois
from app.services.routing import calculate_osrm_route
from app.services.air_quality import fetch_air_quality

logger = logging.getLogger(__name__)

# Key reference transit / employment anchors in Visakhapatnam region
KEY_REGIONAL_ANCHORS = [
    {"name": "Visakhapatnam Railway Station", "lat": 17.7210, "lon": 83.2965, "type": "Intercity Railway Terminal"},
    {"name": "Rushikonda IT SEZ (Tech Park)", "lat": 17.8180, "lon": 83.3850, "type": "IT Employment Hub"},
    {"name": "Visakhapatnam Airport (VTZ)", "lat": 17.7215, "lon": 83.2245, "type": "Airport Terminal"}
]

def update_data_source_metric(db: Session, name: str, source_type: str, status: str, latency_ms: int):
    """Updates or registers operational status and latency for an external provider in data_sources table."""
    try:
        source = db.query(models.DataSource).filter(models.DataSource.name == name).first()
        if not source:
            source = models.DataSource(
                name=name,
                source_type=source_type,
                status=status,
                latency_ms=latency_ms,
                last_checked=datetime.datetime.utcnow()
            )
            db.add(source)
        else:
            source.status = status
            source.latency_ms = latency_ms
            source.last_checked = datetime.datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update data source metric for {name}: {e}")

def run_property_research(property_id: int, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Executes the comprehensive location intelligence research pipeline for a given property.
    Gathers geocoding, nearby POIs (Overpass), air quality (Open-Meteo), and road connectivity (OSRM).
    Persists results in property_research table and updates research_jobs and data_sources.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    start_time = time.time()
    errors = []

    try:
        prop = db.query(models.Property).filter(models.Property.id == property_id).first()
        if not prop:
            logger.error(f"Cannot run research pipeline: Property {property_id} not found")
            return {"status": "error", "message": f"Property {property_id} not found"}

        # Find or create active research job
        job = db.query(models.ResearchJob).filter(
            models.ResearchJob.property_id == property_id
        ).order_by(models.ResearchJob.created_at.desc()).first()

        # Concurrency guard: avoid duplicate concurrent executions if one is actively running (< 30s)
        if job and job.status == "in_progress" and job.updated_at:
            delta = (datetime.datetime.utcnow() - job.updated_at).total_seconds()
            if delta < 30.0:
                logger.info(f"Research pipeline already active for property {property_id} ({delta:.1f}s ago). Avoiding duplicate execution.")
                return {"status": "in_progress", "property_id": property_id, "message": "Research pipeline is already running."}

        if not job:
            job = models.ResearchJob(
                property_id=property_id,
                job_type="Spatial Context & Location Intelligence",
                status="in_progress"
            )
            db.add(job)
        else:
            job.status = "in_progress"
        db.commit()

        lat = prop.latitude
        lon = prop.longitude

        # 1. Reverse Geocoding Validation (Nominatim)
        t0 = time.time()
        geocoding_result = None
        try:
            geocoding_result = reverse_geocode(lat, lon)
            lat_ms = int((time.time() - t0) * 1000)
            status_geo = "healthy" if geocoding_result else "degraded"
            update_data_source_metric(db, "OpenStreetMap Nominatim Geocoding", "Geocoding & Reverse Address", status_geo, lat_ms)
        except Exception as e:
            errors.append(f"Geocoding error: {e}")
            update_data_source_metric(db, "OpenStreetMap Nominatim Geocoding", "Geocoding & Reverse Address", "degraded", 2500)

        # 2. Air Quality Observations (Open-Meteo)
        t0 = time.time()
        air_quality_result = None
        try:
            air_quality_result = fetch_air_quality(lat, lon)
            lat_ms = int((time.time() - t0) * 1000)
            status_aq = "healthy" if air_quality_result and air_quality_result.get("status") == "available" else "degraded"
            update_data_source_metric(db, "Open-Meteo Air Quality Intelligence", "Atmospheric & Environmental AQI", status_aq, lat_ms)
        except Exception as e:
            errors.append(f"Air quality error: {e}")
            update_data_source_metric(db, "Open-Meteo Air Quality Intelligence", "Atmospheric & Environmental AQI", "degraded", 3000)

        # 3. Nearby Amenities & POIs (Overpass API)
        t0 = time.time()
        poi_result = None
        try:
            poi_result = fetch_nearby_pois(lat, lon, max_radius_m=5000)
            lat_ms = int((time.time() - t0) * 1000)
            status_poi = "healthy" if poi_result and poi_result.get("status") == "success" else "degraded"
            update_data_source_metric(db, "OpenStreetMap Overpass Spatial API", "Spatial POI & Amenity Discovery", status_poi, lat_ms)
        except Exception as e:
            errors.append(f"Overpass error: {e}")
            update_data_source_metric(db, "OpenStreetMap Overpass Spatial API", "Spatial POI & Amenity Discovery", "degraded", 4500)

        # 4. Regional Road Connectivity Routes (OSRM)
        t0 = time.time()
        connectivity_routes = []
        try:
            for anchor in KEY_REGIONAL_ANCHORS:
                route = calculate_osrm_route(lat, lon, anchor["lat"], anchor["lon"], anchor["name"])
                if route.get("status") == "success":
                    connectivity_routes.append({
                        "name": anchor["name"],
                        "type": anchor["type"],
                        "road_distance_km": route.get("road_distance_km"),
                        "straight_line_distance_km": route.get("straight_line_distance_km"),
                        "estimated_duration_mins": route.get("estimated_duration_mins"),
                        "tortuosity_ratio": route.get("tortuosity_ratio"),
                        "route_geometry": route.get("route_geometry")
                    })
            lat_ms = int((time.time() - t0) * 1000)
            status_route = "healthy" if connectivity_routes else "degraded"
            update_data_source_metric(db, "OSRM Road Routing Engine", "Topological Road Route & Commute", status_route, lat_ms)
        except Exception as e:
            errors.append(f"Routing error: {e}")
            update_data_source_metric(db, "OSRM Road Routing Engine", "Topological Road Route & Commute", "degraded", 2000)

        # Summarize POI counts by category — distinguish genuine empty from provider failure
        poi_summary = {}
        nearby_pois_data = None
        if poi_result and poi_result.get("status") == "success" and "categories" in poi_result:
            nearby_pois_data = poi_result["categories"]
            for cat, items in poi_result["categories"].items():
                poi_summary[cat] = {
                    "total": len(items),
                    "closest_meters": items[0]["distance_meters"] if items else None,
                    "closest_name": items[0]["name"] if items else None
                }
        elif poi_result and poi_result.get("status") != "success":
            poi_summary = {"status": "unavailable", "error": poi_result.get("error", "Overpass provider failed or timed out")}

        # Determine overall pipeline status: ALL 4 must succeed for complete
        successful_sections = 0
        if geocoding_result: successful_sections += 1
        if air_quality_result and air_quality_result.get("status") == "available": successful_sections += 1
        if poi_result and poi_result.get("status") == "success": successful_sections += 1
        if connectivity_routes: successful_sections += 1

        if successful_sections == 4:
            final_status = "completed"
        elif successful_sections >= 1:
            final_status = "partially_completed"
        else:
            final_status = "failed"

        execution_ms = int((time.time() - start_time) * 1000)

        source_metadata = {
            "execution_time_ms": execution_ms,
            "providers_contacted": [
                "OpenStreetMap Nominatim (Geocoding)",
                "Open-Meteo Air Quality (Copernicus CAMS)",
                "OpenStreetMap Overpass API (Nearby POIs)",
                "OSRM Road Routing Engine (Driving Routes)"
            ],
            "successful_providers": successful_sections,
            "pipeline_version": "2.0-verified-real",
            "last_checked": datetime.datetime.utcnow().isoformat()
        }

        # Update or create PropertyResearch record
        research_record = db.query(models.PropertyResearch).filter(
            models.PropertyResearch.property_id == property_id
        ).first()

        if not research_record:
            research_record = models.PropertyResearch(
                property_id=property_id,
                status=final_status,
                geocoding_data=geocoding_result,
                nearby_pois=nearby_pois_data,
                poi_summary=poi_summary,
                air_quality_data=air_quality_result,
                connectivity_data={"routes": connectivity_routes},
                source_metadata=source_metadata,
                error_details="; ".join(errors) if errors else None,
                last_researched_at=datetime.datetime.utcnow()
            )
            db.add(research_record)
        else:
            research_record.status = final_status
            research_record.geocoding_data = geocoding_result
            research_record.nearby_pois = nearby_pois_data
            research_record.poi_summary = poi_summary
            research_record.air_quality_data = air_quality_result
            research_record.connectivity_data = {"routes": connectivity_routes}
            research_record.source_metadata = source_metadata
            research_record.error_details = "; ".join(errors) if errors else None
            research_record.last_researched_at = datetime.datetime.utcnow()

        # Update ResearchJob
        job.status = final_status
        job.execution_time_ms = execution_ms
        job.error_message = "; ".join(errors) if errors else None
        job.result_summary = (
            f"Research completed in {execution_ms}ms. "
            f"Discovered {poi_result.get('total_pois', 0) if poi_result else 0} nearby POIs. "
            f"Air Quality AQI: {air_quality_result.get('us_aqi') if air_quality_result else 'N/A'}. "
            f"Road connectivity routes computed: {len(connectivity_routes)}."
        )

        # Log audit entry
        audit = models.AuditLog(
            user_id=None,
            action="RESEARCH_PIPELINE_EXECUTED",
            target_type="Property",
            target_id=property_id,
            details=f"Pipeline finished with status '{final_status}' ({successful_sections}/4 providers succeeded in {execution_ms}ms)"
        )
        db.add(audit)

        db.commit()
        db.refresh(research_record)

        logger.info(f"Research pipeline successfully completed for property {property_id} ({final_status})")
        return {
            "status": final_status,
            "property_id": property_id,
            "execution_time_ms": execution_ms,
            "summary": job.result_summary
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Research pipeline fatal error for property {property_id}: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}
    finally:
        if close_db:
            db.close()
