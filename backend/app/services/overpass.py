import httpx
import math
import logging
import datetime
from typing import Dict, Any, List
from app.services.cache import poi_cache

logger = logging.getLogger(__name__)

OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

USER_AGENT = "HI-IN-Property-Directory/2.0 (research@hi-in.demo)"

def compute_haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Computes exact straight-line distance in meters between two coordinates."""
    R = 6371000 # Earth radius in meters
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(round(R * c))

def classify_osm_element(tags: Dict[str, str]) -> Dict[str, str]:
    """Classifies an OSM element into our 6 standard due-diligence categories."""
    amenity = tags.get("amenity", "").lower()
    shop = tags.get("shop", "").lower()
    highway = tags.get("highway", "").lower()
    railway = tags.get("railway", "").lower()
    leisure = tags.get("leisure", "").lower()

    if highway in ["bus_stop", "station"] or railway in ["station", "subway", "halt"] or amenity in ["bus_station", "ferry_terminal"]:
        return {"category": "Public Transport", "type": railway or highway or amenity}

    if amenity in ["school", "college", "university", "kindergarten"]:
        return {"category": "Education", "type": amenity}

    if amenity in ["hospital", "clinic", "pharmacy", "doctors", "dentist"]:
        return {"category": "Healthcare", "type": amenity}

    if shop in ["supermarket", "convenience", "grocery", "mall", "department_store", "general"] or amenity == "marketplace":
        return {"category": "Daily Needs", "type": shop or amenity}

    if amenity in ["restaurant", "cafe", "fast_food", "food_court"] or leisure in ["park", "fitness_centre", "sports_centre"]:
        return {"category": "Lifestyle & Recreation", "type": leisure or amenity}

    if amenity in ["bank", "atm", "post_office", "police"]:
        return {"category": "Public Services", "type": amenity}

    return {"category": "General POI", "type": amenity or shop or "amenity"}

def fetch_nominatim_fallback_pois(latitude: float, longitude: float, radius_km: float = 5.0) -> List[Dict[str, Any]]:
    """
    Directly queries OpenStreetMap Nominatim for POIs around coordinates
    when public Overpass mirrors are unavailable or rate-limited.
    100% genuine OpenStreetMap data.
    """
    delta = round(radius_km / 111.0, 4)
    lon_min = round(longitude - delta, 4)
    lat_max = round(latitude + delta, 4)
    lon_max = round(longitude + delta, 4)
    lat_min = round(latitude - delta, 4)
    viewbox = f"{lon_min},{lat_max},{lon_max},{lat_min}"

    search_targets = [
        ("bus stop", "Public Transport", "bus_stop"),
        ("railway station", "Public Transport", "station"),
        ("school", "Education", "school"),
        ("college", "Education", "college"),
        ("hospital", "Healthcare", "hospital"),
        ("clinic", "Healthcare", "clinic"),
        ("supermarket", "Daily Needs", "supermarket"),
        ("market", "Daily Needs", "marketplace"),
        ("park", "Lifestyle & Recreation", "park"),
        ("restaurant", "Lifestyle & Recreation", "restaurant"),
        ("bank", "Public Services", "bank")
    ]

    elements = []
    headers = {"User-Agent": USER_AGENT}
    try:
        with httpx.Client(timeout=8.0) as client:
            for term, category, ptype in search_targets:
                try:
                    url = f"https://nominatim.openstreetmap.org/search?q={term}&format=json&bounded=1&viewbox={viewbox}&limit=4"
                    res = client.get(url, headers=headers)
                    if res.status_code == 200:
                        items = res.json()
                        for it in items:
                            try:
                                p_lat = float(it.get("lat"))
                                p_lon = float(it.get("lon"))
                                elements.append({
                                    "id": it.get("osm_id") or it.get("place_id"),
                                    "lat": p_lat,
                                    "lon": p_lon,
                                    "tags": {
                                        "name": it.get("name") or it.get("display_name", "").split(",")[0],
                                        "amenity": ptype if category in ["Education", "Healthcare", "Public Services"] else "",
                                        "shop": ptype if category == "Daily Needs" else "",
                                        "highway": ptype if category == "Public Transport" and ptype == "bus_stop" else "",
                                        "railway": ptype if category == "Public Transport" and ptype == "station" else "",
                                        "leisure": ptype if category == "Lifestyle & Recreation" and ptype == "park" else ""
                                    }
                                })
                            except (ValueError, TypeError):
                                continue
                except Exception:
                    continue
    except Exception as e:
        logger.warning(f"Nominatim fallback failed: {e}")

    return elements

def fetch_nearby_pois(latitude: float, longitude: float, max_radius_m: int = 5000) -> Dict[str, Any]:
    """
    Queries Overpass API for amenities and infrastructure around property coordinates.
    Groups results into 1km, 3km, 5km, and 10km radius tiers.
    Falls back gracefully to OpenStreetMap Nominatim spatial queries if Overpass is down.
    """
    lat_r = round(latitude, 4)
    lon_r = round(longitude, 4)
    cache_key = f"overpass_{lat_r}_{lon_r}_{max_radius_m}"

    cached = poi_cache.get(cache_key)
    if cached is not None:
        return cached

    query = f"""[out:json][timeout:12];
(
  node(around:{max_radius_m},{lat_r},{lon_r})["amenity"~"school|college|university|hospital|clinic|pharmacy|bank|atm|restaurant|cafe|marketplace"];
  node(around:{max_radius_m},{lat_r},{lon_r})["shop"~"supermarket|convenience|grocery|mall"];
  node(around:{max_radius_m},{lat_r},{lon_r})["highway"~"bus_stop"];
  node(around:{max_radius_m},{lat_r},{lon_r})["railway"~"station"];
  node(around:{max_radius_m},{lat_r},{lon_r})["leisure"~"park|fitness_centre"];
);
out body 120;
"""

    headers = {"User-Agent": USER_AGENT}
    raw_elements = []
    active_mirror = None
    retrieval_status = "failed"
    error_msg = None

    for mirror in OVERPASS_MIRRORS[:2]:
        try:
            with httpx.Client(timeout=2.5) as client:
                res = client.post(mirror, data={"data": query}, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    raw_elements = data.get("elements", [])
                    active_mirror = mirror
                    retrieval_status = "success"
                    break
                else:
                    error_msg = f"HTTP {res.status_code} from {mirror}"
        except Exception as e:
            error_msg = f"Mirror {mirror} error: {e}"
            continue

    # If Overpass mirrors were unreachable or returned errors, use OpenStreetMap Nominatim
    if retrieval_status != "success" or len(raw_elements) == 0:
        logger.info("Overpass mirrors returned 406 or unavailable. Querying OpenStreetMap Nominatim spatial directory...")
        fallback_elements = fetch_nominatim_fallback_pois(latitude, longitude, radius_km=max_radius_m / 1000.0)
        if fallback_elements:
            raw_elements = fallback_elements
            active_mirror = "https://nominatim.openstreetmap.org/search"
            retrieval_status = "success"
            error_msg = None

    now_iso = datetime.datetime.utcnow().isoformat()

    # Process and deduplicate POIs
    pois_by_category: Dict[str, List[Dict[str, Any]]] = {
        "Public Transport": [],
        "Education": [],
        "Healthcare": [],
        "Daily Needs": [],
        "Lifestyle & Recreation": [],
        "Public Services": []
    }

    tier_counts = {"under_1km": 0, "1_to_3km": 0, "3_to_5km": 0, "5_to_10km": 0}
    seen_keys = set()

    for el in raw_elements:
        tags = el.get("tags", {})
        poi_lat = el.get("lat")
        poi_lon = el.get("lon")
        if not poi_lat or not poi_lon:
            continue

        raw_name = tags.get("name") or tags.get("name:en")
        classification = classify_osm_element(tags)
        category = classification["category"]
        poi_type = classification["type"]

        name = raw_name if raw_name else f"Mapped {poi_type.replace('_', ' ').title()}"

        dist_m = compute_haversine_meters(latitude, longitude, poi_lat, poi_lon)
        dist_km = round(dist_m / 1000.0, 2)

        # Deduplication key
        dedup_key = f"{name.lower()}_{round(poi_lat, 3)}_{round(poi_lon, 3)}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        tier = (
            "under_1km" if dist_m <= 1000 else
            "1_to_3km" if dist_m <= 3000 else
            "3_to_5km" if dist_m <= 5000 else
            "5_to_10km"
        )
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

        poi_item = {
            "id": el.get("id"),
            "osm_id": el.get("id"),
            "name": name,
            "has_custom_name": bool(raw_name),
            "category": category,
            "type": poi_type,
            "latitude": poi_lat,
            "longitude": poi_lon,
            "distance_meters": dist_m,
            "distance_km": dist_km,
            "distance_tier": tier,
            "osm_url": f"https://www.openstreetmap.org/node/{el.get('id')}"
        }

        if category in pois_by_category:
            pois_by_category[category].append(poi_item)

    # Sort each category list by closest distance
    for cat in pois_by_category:
        pois_by_category[cat].sort(key=lambda x: x["distance_meters"])

    total_discovered = sum(len(v) for v in pois_by_category.values())

    result = {
        "status": retrieval_status,
        "provider": "OpenStreetMap Overpass API",
        "active_mirror": active_mirror,
        "retrieved_at": now_iso,
        "property_coordinates": {"lat": latitude, "lon": longitude},
        "query_radius_meters": max_radius_m,
        "total_pois": total_discovered,
        "tier_counts": tier_counts,
        "categories": pois_by_category,
        "coverage_disclaimer": "OpenStreetMap coverage varies by region. Absence of a place on OSM does not confirm it does not exist in reality.",
        "error": error_msg if retrieval_status != "success" else None
    }

    if retrieval_status == "success":
        poi_cache.set(cache_key, result, ttl_seconds=43200)

    return result
