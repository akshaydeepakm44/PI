import httpx
import logging
import datetime
import math
from typing import Dict, Any, Optional, List, Tuple
from app.services.cache import air_quality_cache

logger = logging.getLogger(__name__)

OPEN_METEO_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
USER_AGENT = "HI-IN-Property-Directory/2.0 (research@hi-in.demo)"

# Configured reference official stations (CPCB / State Pollution Control Boards)
OFFICIAL_MONITORS = [
    {
        "station_id": "TSPCB_CU01",
        "station_name": "Central University, Hyderabad - TSPCB",
        "latitude": 17.456,
        "longitude": 78.330,
        "operator": "Central Pollution Control Board / TSPCB",
        "type": "Continuous Ambient Air Quality Monitoring Station (CAAQMS)"
    },
    {
        "station_id": "TSPCB_PAT01",
        "station_name": "ICRISAT, Patancheru - TSPCB",
        "latitude": 17.511,
        "longitude": 78.275,
        "operator": "Central Pollution Control Board / TSPCB",
        "type": "Continuous Ambient Air Quality Monitoring Station (CAAQMS)"
    },
    {
        "station_id": "TSPCB_SAN01",
        "station_name": "Sanathnagar, Hyderabad - TSPCB",
        "latitude": 17.458,
        "longitude": 78.435,
        "operator": "Central Pollution Control Board / TSPCB",
        "type": "Continuous Ambient Air Quality Monitoring Station (CAAQMS)"
    }
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_nearest_official_monitor(lat: float, lon: float) -> Tuple[Dict[str, Any], float]:
    """Finds the nearest configured official monitoring station and its distance in km."""
    best_st = OFFICIAL_MONITORS[0]
    min_dist = float("inf")
    for st in OFFICIAL_MONITORS:
        d = haversine_km(lat, lon, st["latitude"], st["longitude"])
        if d < min_dist:
            min_dist = d
            best_st = st
    return best_st, round(min_dist, 2)


def fetch_air_quality_7d(
    latitude: float,
    longitude: float,
    client: Optional[httpx.Client] = None
) -> Optional[Dict[str, Any]]:
    """
    Fetches hourly PM2.5, PM10, and NO2 observations for the last 7 days.
    Caches results in memory for 1 hour.
    Stores provider, date range, and 'modelled' provenance with every number.
    """
    lat_r = round(latitude, 3)
    lon_r = round(longitude, 3)
    cache_key = f"aqi_7d_{lat_r}_{lon_r}"

    cached = air_quality_cache.get(cache_key)
    if cached is not None:
        return cached

    params = {
        "latitude": lat_r,
        "longitude": lon_r,
        "hourly": "pm2_5,pm10,nitrogen_dioxide,us_aqi",
        "past_days": 7,
        "forecast_days": 0
    }
    headers = {"User-Agent": USER_AGENT}

    try:
        if client:
            resp = client.get(OPEN_METEO_AQ_URL, params=params, headers=headers)
        else:
            with httpx.Client(timeout=10.0) as cl:
                resp = cl.get(OPEN_METEO_AQ_URL, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        pm25 = hourly.get("pm2_5", [])
        pm10 = hourly.get("pm10", [])
        no2 = hourly.get("nitrogen_dioxide", [])
        us_aqi = hourly.get("us_aqi", [])

        if not times or not pm25:
            logger.warning("Empty hourly records returned by air quality API")
            return None

        today = datetime.date.today()
        start_date = (today - datetime.timedelta(days=7)).isoformat()
        end_date = today.isoformat()

        nearest_st, st_dist = get_nearest_official_monitor(lat_r, lon_r)

        result = {
            "provider": "Open-Meteo CAMS Atmospheric Model",
            "date_range": f"{start_date} to {end_date}",
            "data_type": "modelled",
            "hourly_records": [
                {
                    "time": t,
                    "pm2_5": p25,
                    "pm10": p10,
                    "no2": n2,
                    "us_aqi": uaqi
                }
                for t, p25, p10, n2, uaqi in zip(times, pm25, pm10, no2, us_aqi)
            ],
            "nearest_official_monitor": {
                "station_name": nearest_st["station_name"],
                "station_id": nearest_st["station_id"],
                "coordinates": [nearest_st["latitude"], nearest_st["longitude"]],
                "distance_km": st_dist,
                "data_type": "monitor",
                "operator": nearest_st["operator"]
            }
        }

        air_quality_cache.set(cache_key, result, ttl_seconds=3600)
        return result

    except Exception as err:
        logger.warning(f"Air quality 7-day fetch failed for {latitude}, {longitude}: {err}")
        return None


def fetch_air_quality(latitude: float, longitude: float) -> Dict[str, Any]:
    """Compatibility wrapper for pipeline.py."""
    data = fetch_air_quality_7d(latitude, longitude)
    if data:
        return {
            "status": "available",
            "provider": data.get("provider"),
            "data": data
        }
    return {"status": "degraded"}
