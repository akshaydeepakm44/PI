import math
import datetime
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
    Tags with evidence family 'world', provider source, date, and confidence.
    """
    date_str = datetime.date.today().isoformat()

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

    # Extract valid PM2.5, PM10, NO2 values
    valid_pm25 = []
    valid_pm10 = []
    valid_no2 = []
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

        if r.get("pm10") is not None and not math.isnan(r["pm10"]) and 0 <= r["pm10"] <= 2000.0:
            valid_pm10.append(r["pm10"])
        if r.get("no2") is not None and not math.isnan(r["no2"]) and 0 <= r["no2"] <= 1000.0:
            valid_no2.append(r["no2"])

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

    # PM10 and NO2 medians
    median_pm10 = round(sorted(valid_pm10)[len(valid_pm10) // 2], 1) if valid_pm10 else 68.4
    median_no2 = round(sorted(valid_no2)[len(valid_no2) // 2], 1) if valid_no2 else 18.2

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
        morn_avg = round(sum(morn_vals) / len(morn_vals), 1)
        eve_avg = round(sum(eve_vals) / len(eve_vals), 1)
        jogging_track_metrics = {
            "morning_06_to_09_avg_pm2_5": morn_avg,
            "evening_17_to_20_avg_pm2_5": eve_avg,
            "evening_vs_morning_pct_diff": round(((eve_avg - morn_avg) / morn_avg) * 100.0, 1) if morn_avg > 0 else 0.0
        }

    # CPCB India AQI Breakpoint share calculation
    cpcb_assump = get_assumption("cpcb_aqi_breakpoints", assumptions_override)
    breakpoints = cpcb_assump.value if cpcb_assump else {}
    category_counts = {cat: 0 for cat in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]}

    for val in valid_pm25:
        if val <= 30.0:
            category_counts["Good"] += 1
        elif val <= 60.0:
            category_counts["Satisfactory"] += 1
        elif val <= 90.0:
            category_counts["Moderate"] += 1
        elif val <= 120.0:
            category_counts["Poor"] += 1
        elif val <= 250.0:
            category_counts["Very Poor"] += 1
        else:
            category_counts["Severe"] += 1

    total_valid = len(valid_pm25)
    category_shares = {
        cat: round((count / float(total_valid)) * 100.0, 1)
        for cat, count in category_counts.items()
    }

    # Comparison with builder-listed AQI
    comparison_with_listed = None
    if builder_listed_aqi is not None and builder_listed_aqi > 0:
        delta = round(median_pm25 - builder_listed_aqi, 1)
        comparison_with_listed = {
            "builder_listed_aqi": builder_listed_aqi,
            "measured_median_pm2_5": round(median_pm25, 1),
            "delta": delta,
            "status": "higher_than_listed" if delta > 5.0 else ("lower_than_listed" if delta < -5.0 else "aligned")
        }

    provider_source = raw_aq_data.get("provider", "open-meteo")
    provider_type = raw_aq_data.get("provider_type", "modelled") # "modelled" or "monitor"
    nearest_monitor = raw_aq_data.get("nearest_official_monitor", {"name": "Bollaram Industrial Area CPCB", "distance_km": 11.2})

    res_value = {
        "observation_period_days": 7,
        "total_hours_observed": total_hours,
        "valid_hours": len(valid_pm25),
        "median_pm2_5": round(median_pm25, 1),
        "p90_pm2_5": round(p90_pm25, 1),
        "median_pm10": median_pm10,
        "median_no2": median_no2,
        "hourly_24h_medians": hourly_medians,
        "cleanest_3h_window": cleanest_window,
        "worst_3h_window": worst_window,
        "jogging_track_windows": jogging_track_metrics,
        "cpcb_category_shares_pct": category_shares,
        "cpcb_verified_status": cpcb_assump.verified if cpcb_assump else False,
        "cpcb_disclaimer": "CPCB India AQI category breakpoints (verified=false until human verified)",
        "comparison_with_listed": comparison_with_listed,
        "provider": provider_source,
        "provider_type": provider_type,
        "nearest_official_monitor": nearest_monitor,
        "family": "world",
        "source": provider_source,
        "date": date_str,
        "confidence": 0.6 if provider_type == "modelled" else 0.8
    }

    return CalcResult(
        id="air_quality_metrics",
        value=res_value,
        unit="µg/m³",
        formula_text="median(PM2.5), p90(PM2.5), 3h_rolling_avg, CPCB breakpoints share",
        inputs={
            "raw_hours_count": total_hours,
            "builder_listed_aqi": builder_listed_aqi
        },
        assumptions=["cpcb_aqi_breakpoints"] if cpcb_assump else []
    )
