import pytest
from app.services.engines.air_engine import calculate_air_quality_metrics

def test_air_quality_missing_records_guard():
    # Only 20 hours (< 24) -> data gap
    records = [{"time": f"2026-11-{i:02d}T00:00:00", "pm2_5": 30.0, "pm10": 50.0, "no2": 15.0} for i in range(1, 20)]
    raw_data = {"hourly_records": records}
    res = calculate_air_quality_metrics(raw_data, builder_listed_aqi=94)
    assert res.status == "data_gap"
    assert "insufficient_observation_hours" in res.missing_inputs

def test_air_quality_listed_vs_measured_flag():
    # 168 hours with median PM2.5 ~ 40, builder listed 94 (> 25% delta)
    records = []
    for h in range(168):
        records.append({
            "time": f"2026-11-20T{h%24:02d}:00:00",
            "pm2_5": 40.0 + (h % 10),
            "pm10": 70.0,
            "no2": 20.0
        })
    nearest_station = {
        "station_name": "Central University TSPCB",
        "station_id": "TSPCB_CU01",
        "distance_km": 1.8,
        "operator": "CPCB / TSPCB"
    }
    raw_data = {"hourly_records": records, "nearest_official_monitor": nearest_station}
    res = calculate_air_quality_metrics(raw_data, builder_listed_aqi=94)
    assert res.status == "ok"
    val = res.value
    assert val["listed_vs_measured"]["difference_over_25_pct"] is True
    assert val["listed_vs_measured"]["difference_pct"] > 25.0
    assert val["listed_vs_measured"]["nearest_monitor_distance_km"] == 1.8
    assert val["cleanest_3h_window"] is not None
    assert val["worst_3h_window"] is not None

def test_air_quality_station_distance_flag():
    records = [{"time": f"2026-11-20T{h%24:02d}:00:00", "pm2_5": 45.0, "pm10": 75.0, "no2": 22.0} for h in range(168)]
    far_station = {
        "station_name": "Remote Station",
        "distance_km": 8.5
    }
    raw_data = {"hourly_records": records, "nearest_official_monitor": far_station}
    res = calculate_air_quality_metrics(raw_data, builder_listed_aqi=45)
    assert res.status == "ok"
    assert res.value["listed_vs_measured"]["station_exceeds_5km_threshold"] is True

def test_cpcb_unverified_flag():
    records = [{"time": f"2026-11-20T{h%24:02d}:00:00", "pm2_5": 55.0, "pm10": 80.0, "no2": 25.0} for h in range(168)]
    raw_data = {"hourly_records": records}
    res = calculate_air_quality_metrics(raw_data)
    assert res.status == "ok"
    assert res.value["cpcb_breakpoints_verified"] is False
    assert "unverified" in res.value["cpcb_reporting_mode"].lower()
