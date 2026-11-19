from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from app.services.geocoding import forward_geocode, reverse_geocode

router = APIRouter(prefix="/geocoding", tags=["Geocoding"])

@router.get("/search", response_model=List[Dict[str, Any]])
def search_address(
    q: str = Query(..., min_length=2, description="Address, landmark or locality to search"),
    limit: int = Query(5, ge=1, le=10)
):
    """
    Searches for places and addresses using OpenStreetMap Nominatim.
    Used by sellers for accurate pin placement and buyers for commute destination search.
    """
    results = forward_geocode(q, limit=limit)
    return results

@router.get("/reverse", response_model=Dict[str, Any])
def get_address_from_coordinates(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    """
    Reverse-geocodes GPS coordinates into formatted address hierarchy.
    """
    result = reverse_geocode(lat, lon)
    if not result:
        raise HTTPException(status_code=404, detail="No address found for the given coordinates")
    return result
