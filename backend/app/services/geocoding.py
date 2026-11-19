import httpx
import logging
from typing import List, Dict, Any, Optional
from app.services.cache import geocoding_cache, nominatim_limiter

logger = logging.getLogger(__name__)

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
USER_AGENT = "HI-IN-Property-Directory/2.0 (contact: research@hi-in.demo)"

def forward_geocode(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Geocodes a search string into geographical coordinates using OpenStreetMap Nominatim.
    Adheres to usage policies with polite rate-limiting, user-agent, and local caching.
    Includes smart locality fallback if an ultra-specific building name has no exact OSM node.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    cache_key = f"fwd_{clean_query.lower()}_{limit}"
    cached = geocoding_cache.get(cache_key)
    if cached is not None:
        return cached

    # Wait for rate limiter (minimum 1.1s between calls)
    nominatim_limiter.wait()

    headers = {"User-Agent": USER_AGENT}

    def _query_nominatim(q_str: str) -> List[Dict[str, Any]]:
        params = {
            "q": q_str,
            "format": "jsonv2",
            "addressdetails": 1,
            "limit": limit
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{NOMINATIM_BASE_URL}/search", params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()

    try:
        data = _query_nominatim(clean_query)

        # Smart fallback if exact query returned no results (e.g. 'vsnr residency , madhurawada')
        is_fallback = False
        fallback_prefix = ''
        if not data and ',' in clean_query:
            parts = [p.strip() for p in clean_query.split(',') if p.strip()]
            if len(parts) > 1:
                # Try locality part with Visakhapatnam
                fallback_q = f"{parts[-1]}, Visakhapatnam"
                nominatim_limiter.wait()
                data = _query_nominatim(fallback_q)
                if data:
                    is_fallback = True
                    fallback_prefix = f"{parts[0].title()} · "

        if not data and 'visakhapatnam' not in clean_query.lower() and 'vizag' not in clean_query.lower():
            nominatim_limiter.wait()
            data = _query_nominatim(f"{clean_query}, Visakhapatnam")

        results = []
        for item in data:
            addr = item.get("address", {})
            display_name = item.get("display_name", "")
            if is_fallback and fallback_prefix:
                display_name = f"{fallback_prefix}{display_name}"

            results.append({
                "place_id": item.get("place_id"),
                "osm_id": item.get("osm_id"),
                "osm_type": item.get("osm_type"),
                "display_name": display_name,
                "latitude": float(item.get("lat")),
                "longitude": float(item.get("lon")),
                "category": item.get("category"),
                "type": item.get("type"),
                "importance": item.get("importance", 0.0),
                "address": {
                    "road": addr.get("road") or addr.get("pedestrian"),
                    "neighbourhood": addr.get("neighbourhood") or addr.get("suburb"),
                    "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county"),
                    "state": addr.get("state"),
                    "postcode": addr.get("postcode"),
                    "country": addr.get("country", "India")
                }
            })

        geocoding_cache.set(cache_key, results, ttl_seconds=86400)
        return results

    except Exception as e:
        logger.warning(f"Nominatim forward geocode failed for '{query}': {e}")
        return []


def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """
    Converts coordinates to human-readable address hierarchy using Nominatim reverse API.
    """
    # Round to 5 decimal places for caching (~1.1 meter precision)
    lat_r = round(latitude, 5)
    lon_r = round(longitude, 5)
    cache_key = f"rev_{lat_r}_{lon_r}"

    cached = geocoding_cache.get(cache_key)
    if cached is not None:
        return cached

    nominatim_limiter.wait()

    params = {
        "lat": lat_r,
        "lon": lon_r,
        "format": "jsonv2",
        "addressdetails": 1
    }
    headers = {"User-Agent": USER_AGENT}

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{NOMINATIM_BASE_URL}/reverse", params=params, headers=headers)
            response.raise_for_status()
            item = response.json()

            addr = item.get("address", {})
            result = {
                "place_id": item.get("place_id"),
                "osm_id": item.get("osm_id"),
                "display_name": item.get("display_name"),
                "latitude": float(item.get("lat")),
                "longitude": float(item.get("lon")),
                "address": {
                    "road": addr.get("road") or addr.get("pedestrian") or addr.get("residential"),
                    "locality": addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential"),
                    "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("district") or addr.get("county"),
                    "state": addr.get("state"),
                    "postcode": addr.get("postcode"),
                    "country": addr.get("country", "India")
                }
            }

            geocoding_cache.set(cache_key, result, ttl_seconds=86400)
            return result

    except Exception as e:
        logger.warning(f"Nominatim reverse geocode failed for ({latitude}, {longitude}): {e}")
        return None
