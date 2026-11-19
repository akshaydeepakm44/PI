from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from app.services.routing import calculate_osrm_route

router = APIRouter(prefix="/routing", tags=["Routing"])

class RouteRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lon: float = Field(..., ge=-180.0, le=180.0)
    dest_lat: float = Field(..., ge=-90.0, le=90.0)
    dest_lon: float = Field(..., ge=-180.0, le=180.0)
    destination_name: Optional[str] = "Destination"

@router.post("/route", response_model=Dict[str, Any])
def compute_route(req: RouteRequest):
    """
    Computes an authentic road route using OSRM.
    Returns network road distance (km), estimated duration, straight-line comparison, and GeoJSON route geometry.
    """
    res = calculate_osrm_route(
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        dest_lat=req.dest_lat,
        dest_lon=req.dest_lon,
        destination_name=req.destination_name
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=502, detail=res.get("error_message", "Routing failed"))
    return res
