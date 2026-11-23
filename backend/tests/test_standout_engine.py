import pytest
from app.services.engines.standout_engine import (
    calculate_property_standout_metrics,
    compute_peer_cohort_analysis
)

def test_peer_cohort_excludes_self():
    target = {
        "id": 1,
        "title": "QA Orbit Heights",
        "city": "Hyderabad",
        "status": "Under Construction",
        "price": 11200000,
        "carpet_area": 897,
        "super_builtup_area": 1300,
        "total_units": 1406,
        "unit_count": 1406,
        "acreage": 16.5,
        "site_acres": 16.5,
        "clubhouse_sqft": 40000,
        "towers": 6,
        "floors": 24,
        "passenger_lifts_per_tower": 3
    }
    peers = [
        {"id": 1, "city": "Hyderabad", "status": "Under Construction", "price": 11200000, "carpet_area": 897, "super_builtup_area": 1300, "total_units": 1406},
        {"id": 2, "city": "Hyderabad", "status": "Under Construction", "price": 12500000, "carpet_area": 950, "super_builtup_area": 1400, "total_units": 800},
        {"id": 3, "city": "Hyderabad", "status": "New Launch", "price": 9500000, "carpet_area": 820, "super_builtup_area": 1200, "total_units": 650},
        {"id": 4, "city": "Hyderabad", "status": "Under Construction", "price": 15000000, "carpet_area": 1100, "super_builtup_area": 1650, "total_units": 1200},
        {"id": 5, "city": "Hyderabad", "status": "New Launch", "price": 10500000, "carpet_area": 880, "super_builtup_area": 1280, "total_units": 900},
        {"id": 6, "city": "Hyderabad", "status": "Under Construction", "price": 13500000, "carpet_area": 1020, "super_builtup_area": 1500, "total_units": 1100},
        {"id": 7, "city": "Hyderabad", "status": "Under Construction", "price": 14500000, "carpet_area": 1050, "super_builtup_area": 1550, "total_units": 1000},
    ]

    analysis_res = compute_peer_cohort_analysis(property_id=1, property_data=target, peer_properties=peers)
    assert analysis_res.status == "ok"
    analysis = analysis_res.value
    # Target id 1 must be excluded from peers, leaving 6 active peers
    assert analysis["footer"]["peer_count"] == 6
    assert analysis["footer"]["mode"] == "ranked"
    assert len(analysis["standouts"]) == 3
    assert analysis["worth_weighing"] is not None
    assert len(analysis["signature_line"].split()) <= 25

def test_peer_cohort_fewer_than_5_peers_absolute_mode():
    target = {
        "id": 1,
        "title": "QA Orbit Heights",
        "city": "Vizag",
        "status": "Under Construction",
        "price": 11200000,
        "carpet_area": 897,
        "super_builtup_area": 1300,
        "total_units": 1406,
        "acreage": 16.5,
        "site_acres": 16.5,
        "towers": 6,
        "passenger_lifts_per_tower": 3
    }
    few_peers = [
        {"id": 2, "city": "Vizag", "status": "Under Construction", "price": 12500000, "carpet_area": 950, "super_builtup_area": 1400},
        {"id": 3, "city": "Vizag", "status": "New Launch", "price": 9500000, "carpet_area": 820, "super_builtup_area": 1200},
    ]

    analysis_res = compute_peer_cohort_analysis(property_id=1, property_data=target, peer_properties=few_peers)
    assert analysis_res.status == "ok"
    analysis = analysis_res.value
    # Only 2 peers -> absolute mode
    assert analysis["footer"]["peer_count"] == 2
    assert analysis["footer"]["mode"] == "absolute"
    # All standouts must have peer_context: "not ranked: fewer than 5 peers"
    for st in analysis["standouts"]:
        assert st["peer_context"] == "not ranked: fewer than 5 peers"
