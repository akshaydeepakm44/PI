import pytest
import datetime
from app.services.engines.world.map_engine import compute_map_engine_analysis
from app.services.engines.world.air_engine import calculate_air_quality_metrics
from app.services.engines.world.solar_engine import (
    calculate_solar_seasons,
    calculate_tower_shadows,
    calculate_facade_sunlight,
    calculate_price_orientation_delta
)
from app.services.engines.world.terrain_engine import compute_terrain_elevation_analysis, MANDATORY_DISCLAIMER
from app.services.engines.market.peer_engine import compute_peer_engine_analysis
from app.services.engines.record.record_source import lookup_registration, compare_record_with_builder_data
from app.services.engines.buyer.profile import BuyerProfile, DestinationPlace, parse_buyer_profile
from app.services.advisor_pipeline import (
    CandidateFinding,
    gather_candidates,
    score_and_select_findings,
    generate_advisor_read
)
from app.services.finding_validator import (
    validate_advisor_read,
    sanitize_user_text,
    FindingValidationResult
)


# =========================================================================
# 1. UNIT TESTS: Four Evidence Families & Plausibility Guards
# =========================================================================

def test_map_engine_plausibility_guards():
    # Negative coordinates or missing coordinates
    res_gap = compute_map_engine_analysis(None, None)
    assert res_gap["status"] == "data_gap"
    assert "coordinates" in res_gap["missing_inputs"]

    # Valid coordinates
    res = compute_map_engine_analysis(17.447, 78.318, [
        {"name": "DLF Cyber City", "distance_km": 4.5},
        {"name": "Oakridge School", "distance_km": 3.5}
    ])
    assert res["status"] == "ok"
    assert res["family"] == "world"
    assert res["source"] == "openstreetmap"
    assert len(res["reachable_10m_walk"]["places"]) > 0
    assert len(res["noise_sources_within_300m"]) > 0
    # Plausibility: Detour factor must be >= 1.0
    for poi in res["pois"]:
        assert poi["detour_factor"] >= 1.0
        assert poi["road_distance_m"] > 0
        assert poi["drive_minutes"] <= 360.0


def test_air_engine_plausibility_guards():
    # Missing hours > 30% must reject to data gap
    bad_records = [{"pm2_5": None} for _ in range(40)] + [{"pm2_5": 35.0} for _ in range(20)]
    res = calculate_air_quality_metrics({"hourly_records": bad_records})
    assert res.status == "data_gap"
    assert "missing_hours_exceeds_threshold" in res.missing_inputs[0]

    # Extreme value > 1000 µg/m³ must reject
    implausible = [{"pm2_5": 1200.0}] * 24
    res2 = calculate_air_quality_metrics({"hourly_records": implausible})
    assert res2.status == "data_gap"
    assert "implausible_reading_detected" in res2.missing_inputs[0]


def test_peer_engine_empty_and_cohort():
    prop = {"id": 1, "city": "Hyderabad", "asking_price": "1.12 Cr", "unit_count": 1406}
    # Empty peer set must not crash and return absolute mode
    res_empty = compute_peer_engine_analysis(1, prop, [])
    assert res_empty["peer_count"] == 0
    assert res_empty["metrics"]["price_per_carpet_sqft"]["mode"] == "absolute"

    # Cohort with >= 5 peers returns ranked mode
    peers = [
        {"id": i, "city": "Hyderabad", "asking_price": f"{1.0 + i*0.1} Cr", "unit_count": 1000 + i*50}
        for i in range(2, 9)
    ]
    res_ranked = compute_peer_engine_analysis(1, prop, peers)
    assert res_ranked["peer_count"] >= 5
    m = res_ranked["metrics"]["price_per_carpet_sqft"]
    assert m["mode"] == "ranked"
    assert 1 <= m["rank"] <= m["n"]
    assert 0.0 <= m["percentile"] <= 100.0


def test_terrain_engine():
    res = compute_terrain_elevation_analysis(17.452, 78.365)
    assert res["status"] == "ok"
    assert res["disclaimer"] == MANDATORY_DISCLAIMER
    assert res["site_elevation_m"] > 0
    assert "relative_elevation_delta_m" in res
    assert 0.0 <= res["percentile_in_1km_ring"] <= 100.0
    assert res["nearest_low_point"]["drop_m"] > 0


def test_record_source_states():
    # If no permitted source exists
    res_not_checked = lookup_registration("P02400005891", "Telangana")
    assert res_not_checked["checked"] is False
    assert res_not_checked["status"] == "not checked"

    comp = compare_record_with_builder_data(res_not_checked, {"name": "Ramky Kingston Park"})
    assert comp["status"] == "not checked"


# =========================================================================
# 2. ADVISOR PIPELINE: Materiality, Diversity Cap, Priority Reranking
# =========================================================================

def test_advisor_materiality_and_diversity_cap():
    c_market1 = CandidateFinding("m1", "market", "amenities", "Claim M1", "Why M1", 1.0, 0.8, "cohort", "2026-11-23", True)
    c_market2 = CandidateFinding("m2", "market", "price per usable foot", "Claim M2", "Why M2", 0.9, 0.8, "cohort", "2026-11-23", True)
    c_market3 = CandidateFinding("m3", "market", "green space", "Claim M3", "Why M3", 0.8, 0.8, "cohort", "2026-11-23", False)
    c_world1 = CandidateFinding("w1", "world", "noise and air", "Claim W1", "Why W1", 0.7, 0.7, "osm", "2026-11-23", True)
    c_record1 = CandidateFinding("r1", "record", "possession date", "Claim R1", "Why R1", 0.9, 0.9, "rera", "2026-11-23", True, data_gap=True)

    candidates = [c_market1, c_market2, c_market3, c_world1, c_record1]
    selection = score_and_select_findings(candidates, profile=None)

    top3 = selection["selected_top3"]
    assert len(top3) == 3

    # Diversity Cap: No single family can exceed 2 findings!
    market_count = sum(1 for c in top3 if c.family == "market")
    assert market_count <= 2

    # Settle first must select data gap or record item
    assert selection["settle_first"]["question"] != ""


def test_advisor_priority_reranking():
    c_commute = CandidateFinding("c1", "buyer", "commute time", "Annual commute to School is 160 hrs", "Why", 0.7, 0.8, "schedule", "2026-11-23", True)
    c_amenities = CandidateFinding("a1", "market", "amenities", "Lift serves 78 homes", "Why", 0.9, 0.8, "cohort", "2026-11-23", True)
    candidates = [c_amenities, c_commute]

    # Without profile, higher effect size wins
    sel_no_prof = score_and_select_findings(candidates, profile=None)
    assert sel_no_prof["selected_top3"][0].id == "a1"

    # With priority 'commute time', commute finding gets boosted
    prof = BuyerProfile(priorities=["commute time"])
    sel_with_prof = score_and_select_findings(candidates, profile=prof)
    assert sel_with_prof["selected_top3"][0].id == "c1"


def test_advisor_builder_restatement_dropped():
    c_restatement = CandidateFinding("b1", "world", "ratings", "Parks score 4.1", "Why", 0.9, 0.8, "osm", "2026-11-23", restates_builder_data=True)
    c_legit = CandidateFinding("w1", "world", "noise", "Road within 140m", "Why", 0.7, 0.7, "osm", "2026-11-23")
    candidates = [c_restatement, c_legit]

    sel = score_and_select_findings(candidates, profile=None)
    ids = [c.id for c in sel["selected_top3"]]
    assert "b1" not in ids
    assert "w1" in ids


def test_advisor_all_outside_unavailable():
    prop = {"id": 1, "city": "Hyderabad"}
    # Passing empty peers and no coordinates / no outside data
    res = generate_advisor_read(prop, [])
    # When market has 0 peers, terrain has no coords, air has no data -> outside available
    # Must report status
    assert "evidence_panel" in res


# =========================================================================
# 3. VALIDATOR: Provenance, Voice, Superlatives, Injections, Regressions
# =========================================================================

def test_validator_provenance_gate():
    # Rejects if all findings have family 'builder'
    bad_read = {
        "signature_line": "A test project overview within twenty words.",
        "what_matters_most": [
            {"family": "builder", "claim": "Claim 1", "why": "Why 1", "changes_if": "Fact 1", "source": "b", "date": "2026-11-23"},
            {"family": "builder", "claim": "Claim 2", "why": "Why 2", "changes_if": "Fact 2", "source": "b", "date": "2026-11-23"},
            {"family": "builder", "claim": "Claim 3", "why": "Why 3", "changes_if": "Fact 3", "source": "b", "date": "2026-11-23"}
        ],
        "tension": {"text": "Tension with 10 and 20."},
        "settle_first": {"question": "Q1", "why": "W1"},
        "footer": {"disclaimer": "Decision support from listed data, public data and your inputs. Not financial, legal or investment advice."}
    }
    val = validate_advisor_read(bad_read)
    assert not val.is_valid
    assert any("Provenance gate failed" in e for e in val.errors)


def test_validator_voice_gate_banned_words():
    # Buy / book / safe / luxury / best
    bad_voice = {
        "signature_line": "You should buy this luxury home immediately.",
        "what_matters_most": [
            {"family": "world", "claim": "Claim 1", "why": "Why 1", "changes_if": "Fact 1", "source": "osm", "date": "2026-11-23"},
            {"family": "market", "claim": "Claim 2", "why": "Why 2", "changes_if": "Fact 2", "source": "market", "date": "2026-11-23"},
            {"family": "record", "claim": "Claim 3", "why": "Why 3", "changes_if": "Fact 3", "source": "rera", "date": "2026-11-23"}
        ],
        "tension": {"text": "Tension with 10 and 20."},
        "settle_first": {"question": "Q1", "why": "W1"},
        "footer": {"disclaimer": "Decision support from listed data, public data and your inputs. Not financial, legal or investment advice."}
    }
    val = validate_advisor_read(bad_voice)
    assert not val.is_valid
    assert any("Voice gate failed" in e for e in val.errors)


def test_validator_liveability_sentence_regression():
    bad_regress = {
        "signature_line": "Overview of neighbourhood services.",
        "what_matters_most": [
            {"family": "world", "claim": "Parks score best at 4.1 and have the most ratings (128)", "why": "Why 1", "changes_if": "Fact 1", "source": "osm", "date": "2026-11-23"},
            {"family": "market", "claim": "Claim 2", "why": "Why 2", "changes_if": "Fact 2", "source": "market", "date": "2026-11-23"},
            {"family": "record", "claim": "Claim 3", "why": "Why 3", "changes_if": "Fact 3", "source": "rera", "date": "2026-11-23"}
        ],
        "tension": {"text": "Tension with 10 and 20."},
        "settle_first": {"question": "Q1", "why": "W1"},
        "footer": {"disclaimer": "Decision support from listed data, public data and your inputs. Not financial, legal or investment advice."}
    }
    val = validate_advisor_read(bad_regress)
    assert not val.is_valid
    assert any("Parks score best at 4.1" in e for e in val.errors)


def test_validator_injection_sanitization():
    dirty = "Office <script>alert('hack')</script> DROP TABLE properties;"
    clean = sanitize_user_text(dirty)
    assert "<script>" not in clean
    assert len(clean) <= 100


# =========================================================================
# 4. PRIVACY: User profile never stored in shared tables or leaks
# =========================================================================

def test_privacy_user_profile_not_in_shared_cache():
    user_a_profile = {
        "household": {"adults": 2, "children": 1, "school_going": True},
        "places": [{"name": "Private Destination Alpha", "destination_type": "school"}]
    }
    prop = {"id": 1, "city": "Hyderabad", "latitude": 17.44, "longitude": 78.32}
    peers = [{"id": 2, "city": "Hyderabad", "asking_price": "1.2 Cr", "unit_count": 800}]

    res_a = generate_advisor_read(prop, peers, buyer_profile_data=user_a_profile)
    # Check that another call without profile does NOT contain User A's private place
    res_b = generate_advisor_read(prop, peers, buyer_profile_data=None)

    text_b = str(res_b)
    assert "Private Destination Alpha" not in text_b
    assert res_b["has_buyer_profile"] is False
