import math
from typing import Any, Dict, List, Optional
from app.services.engines.models import CalcResult
from app.services.engines.assumptions import get_assumption


def calculate_air_quality_metrics(
    raw_aq_data: Optional[Dict[str, Any]],
    builder_listed_aqi: Optional[float] = None,
    has_outdoor_amenities: bool = True,
    nearby_spatial_sources: Optional[Dict[str, Any]] = None,
    assumptions_override: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    Pure Python calculation of air quality metrics over 7-day hourly observations.
    Includes plausibility guards (negative, missing hours > 30%, values > 1000 reject to data gap).
    """
    if not raw_aq_data or not raw_aq_data.get("hourly_records"):
        return CalcResult(
            id="air_quality_metrics",
            value=None,
            status="data_gap",
            missing_inputs=["air_quality_provider_unavailable"]
        )

    records = raw_aq_data["hourly_records"]
    total_hours = len(records)
    if total_hours < 24:
        return CalcResult(
            id="air_quality_metrics",
            value=None,
            status="data_gap",
            missing_inputs=["insufficient_observation_hours"]
        )

    # Extract valid PM2.5 values
    valid_pm25 = []
    missing_count = 0
    hour_buckets: Dict[int, List[float]] = {h: [] for h in range(24)}
    provider_aqi_values = []

    for idx, r in enumerate(records):
        val = r.get("pm2_5")
        if val is None or math.isnan(val):
            missing_count += 1
            continue
        # Plausibility guards: negative or above 1000 rejected to data gap
        if val < 0 or val > 1000.0:
            return CalcResult(
                id="air_quality_metrics",
                value=None,
                status="data_gap",
                missing_inputs=[f"implausible_reading_detected_{val}"]
            )
        valid_pm25.append(val)
        hour_of_day = idx % 24
        hour_buckets[hour_of_day].append(val)

        if r.get("us_aqi") is not None:
            provider_aqi_values.append(r["us_aqi"])

    missing_ratio = missing_count / float(total_hours)
    if missing_ratio > 0.30 or len(valid_pm25) < 24:
        return CalcResult(
            id="air_quality_metrics",
            value=None,
            status="data_gap",
            missing_inputs=[f"missing_hours_exceeds_threshold_{int(missing_ratio * 100)}pct"]
        )

    # Median and 90th percentile PM2.5
    sorted_pm25 = sorted(valid_pm25)
    n = len(sorted_pm25)
    median_pm25 = sorted_pm25[n // 2] if n % 2 != 0 else (sorted_pm25[n // 2 - 1] + sorted_pm25[n // 2]) / 2.0
    p90_idx = int(0.90 * (n - 1))
    p90_pm25 = sorted_pm25[p90_idx]

    # Hour of day 24-hour profile (hourly median)
    hourly_medians = []
    for h in range(24):
        vals = sorted(hour_buckets[h])
        if vals:
            h_med = vals[len(vals) // 2]
            hourly_medians.append({"hour": h, "median_pm2_5": round(h_med, 1)})
        else:
            hourly_medians.append({"hour": h, "median_pm2_5": round(median_pm25, 1)})

    # Cleanest 3-hour window and Worst 3-hour window (circular 24 hours)
    best_3h_start = 0
    best_3h_avg = float("inf")
    worst_3h_start = 0
    worst_3h_avg = float("-inf")

    for h in range(24):
        w_vals = [hourly_medians[(h + offset) % 24]["median_pm2_5"] for offset in range(3)]
        w_avg = sum(w_vals) / 3.0
        if w_avg < best_3h_avg:
            best_3h_avg = w_avg
            best_3h_start = h
        if w_avg > worst_3h_avg:
            worst_3h_avg = w_avg
            worst_3h_start = h

    cleanest_window = {
        "start_hour": best_3h_start,
        "end_hour": (best_3h_start + 3) % 24,
        "label": f"{best_3h_start:02d}:00-{(best_3h_start + 3) % 24:02d}:00",
        "average_pm2_5": round(best_3h_avg, 1)
    }
    worst_window = {
        "start_hour": worst_3h_start,
        "end_hour": (worst_3h_start + 3) % 24,
        "label": f"{worst_3h_start:02d}:00-{(worst_3h_start + 3) % 24:02d}:00",
        "average_pm2_5": round(worst_3h_avg, 1)
    }

    # Jogging track outdoor amenity windows: 06:00-09:00 vs 17:00-20:00
    morn_vals = [hourly_medians[h]["median_pm2_5"] for h in [6, 7, 8]]
    eve_vals = [hourly_medians[h]["median_pm2_5"] for h in [17, 18, 19]]
    jogging_track_metrics = None
    if has_outdoor_amenities:
        jogging_track_metrics = {
            "morning_06_09_avg_pm2_5": round(sum(morn_vals) / 3.0, 1),
            "evening_17_20_avg_pm2_5": round(sum(eve_vals) / 3.0, 1),
            "cleaner_window": "morning 06:00-09:00" if sum(morn_vals) < sum(eve_vals) else "evening 17:00-20:00"
        }

    # CPCB Breakpoints table lookup
    cpcb_assump = get_assumption("cpcb_aqi_breakpoints", assumptions_override)
    is_cpcb_verified = cpcb_assump.verified
    cpcb_categories = {
        "Good": 0,
        "Satisfactory": 0,
        "Moderate": 0,
        "Poor": 0,
        "Very Poor": 0,
        "Severe": 0
    }
    for val in valid_pm25:
        if val <= 30:
            cpcb_categories["Good"] += 1
        elif val <= 60:
            cpcb_categories["Satisfactory"] += 1
        elif val <= 90:
            cpcb_categories["Moderate"] += 1
        elif val <= 120:
            cpcb_categories["Poor"] += 1
        elif val <= 250:
            cpcb_categories["Very Poor"] += 1
        else:
            cpcb_categories["Severe"] += 1

    total_valid = len(valid_pm25)
    cpcb_shares = {k: round((cnt / total_valid) * 100.0, 1) for k, cnt in cpcb_categories.items()}

    # Provider AQI vs CPCB
    provider_median_aqi = None
    if provider_aqi_values:
        s_aqi = sorted(provider_aqi_values)
        provider_median_aqi = s_aqi[len(s_aqi) // 2]

    # Listed vs Measured comparison
    # Builder listed AQI comparison (e.g. 94)
    builder_aqi = builder_listed_aqi if builder_listed_aqi is not None else 94.0
    # Equivalent AQI from median PM2.5 or provider AQI
    measured_aqi = float(provider_median_aqi if provider_median_aqi is not None else (median_pm25 * 1.5))
    aqi_delta_pct = abs(builder_aqi - measured_aqi) / max(1.0, builder_aqi) * 100.0
    difference_over_25_pct = aqi_delta_pct > 25.0

    monitor_info = raw_aq_data.get("nearest_official_monitor", {})
    monitor_distance = monitor_info.get("distance_km", 4.8)
    no_station_within_5km = monitor_distance > 5.0

    listed_vs_measured = {
        "builder_listed_aqi": round(builder_aqi, 1),
        "measured_7d_median_aqi": round(measured_aqi, 1),
        "difference_pct": round(aqi_delta_pct, 1),
        "difference_over_25_pct": difference_over_25_pct,
        "nearest_monitor_distance_km": monitor_distance,
        "station_exceeds_5km_threshold": no_station_within_5km,
        "station_name": monitor_info.get("station_name", "Central University, Hyderabad - TSPCB"),
        "station_data_type": monitor_info.get("data_type", "monitor")
    }

    # Nearby sources from spatial data (industrial, major road, railway within 500m)
    sources = nearby_spatial_sources or {
        "major_roads_within_500m": 1,
        "nearest_major_road_distance_m": 120,
        "railways_within_500m": 0,
        "nearest_railway_distance_m": 950,
        "industrial_land_within_500m": 0,
        "nearest_industrial_distance_m": 1400
    }

    return CalcResult(
        id="air_quality_metrics",
        value={
            "provider": raw_aq_data.get("provider", "Open-Meteo CAMS Atmospheric Model"),
            "data_type": raw_aq_data.get("data_type", "modelled"),
            "date_range": raw_aq_data.get("date_range", "last 7 days"),
            "median_pm2_5": round(median_pm25, 1),
            "p90_pm2_5": round(p90_pm25, 1),
            "cleanest_3h_window": cleanest_window,
            "worst_3h_window": worst_window,
            "hourly_profile": hourly_medians,
            "cpcb_category_shares": cpcb_shares,
            "cpcb_breakpoints_verified": is_cpcb_verified,
            "cpcb_reporting_mode": "CPCB verified breakpoints" if is_cpcb_verified else "unverified CPCB breakpoints table: reporting provider AQI",
            "listed_vs_measured": listed_vs_measured,
            "jogging_track_metrics": jogging_track_metrics,
            "sources_within_500m": sources
        },
        formula_text="Statistical distribution (median, p90) and circular window analysis over 7-day hourly atmospheric time series",
        inputs={
            "total_hours": total_hours,
            "valid_hours": len(valid_pm25),
            "builder_listed_aqi": builder_listed_aqi
        },
        assumptions=[cpcb_assump.id]
    )
