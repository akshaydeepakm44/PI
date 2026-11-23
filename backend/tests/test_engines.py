import pytest
from app.services.engines import (
    offer_skew,
    marginal_cost,
    usable_foot,
    true_cheque,
    check_floor_rise_conflict,
    density_per_floor,
    consistency,
    basement_footprint,
    annual_commute_hours,
    implied_speed,
    straight_line_distances,
    claim_ledger,
    get_assumption,
    ASSUMPTIONS_REGISTRY
)

# ==============================================================================
# SECTION 4 FIXTURES (Sample project specified in requirements):
# 2 BHK: 1,300 sq ft, carpet 897, price 1.12 Cr (11,200,000)
# 3 BHK: 1,880 sq ft, carpet 1,297, price 1.62 Cr (16,200,000)
# Base rate: 8,600
# Floor rise: 25 per sq ft above floor 4
# Towers A-F floors: 24, 22, 20, 24, 22, 20
# Totals: 235, 235, 234, 234, 234, 234 (declared 10 units/floor, 3 passenger lifts)
# Site: 16.5 acres
# Commute: office 2.8 km 12 min, school 3.4 km 15 min
# ==============================================================================

@pytest.fixture
def sample_blocks():
    return [
        {"name": "Tower A", "floors": 24, "units_count": 235, "passenger_lifts": 3, "declared_units_per_floor": 10},
        {"name": "Tower B", "floors": 22, "units_count": 235, "passenger_lifts": 3, "declared_units_per_floor": 10},
        {"name": "Tower C", "floors": 20, "units_count": 234, "passenger_lifts": 3, "declared_units_per_floor": 10},
        {"name": "Tower D", "floors": 24, "units_count": 234, "passenger_lifts": 3, "declared_units_per_floor": 10},
        {"name": "Tower E", "floors": 22, "units_count": 234, "passenger_lifts": 3, "declared_units_per_floor": 10},
        {"name": "Tower F", "floors": 20, "units_count": 234, "passenger_lifts": 3, "declared_units_per_floor": 10},
    ]


def test_usable_foot():
    """Expected: carpet rate 12,486; efficiency 69%; headline equals base x area within 1%."""
    res = usable_foot(price=11200000, sba=1300, carpet=897, base_rate=8600)
    assert res.value is not None
    assert round(res.value["rate_per_carpet"]) == 12486
    assert res.value["carpet_efficiency_pct"] == 69.0
    assert res.value["headline_matches_base_rate"] is True
    assert res.value["headline_discrepancy_pct"] < 1.0


def test_usable_foot_property_1_regression_separate_balcony_and_common_area():
    """
    Item 1 Regression Test:
    Use the unit's common_area and balcony fields separately.
    If either is missing, call the 403 sq ft difference 'area between super built-up and carpet',
    never 'common area' or 'non-usable'.
    Verify on Property 1 using the page values (common 299, balcony 104).
    """
    # Property 1 (2 BHK): SBA 1300, Carpet 897, Balcony 104, Common area 299, Price 11,200,000
    res = usable_foot(
        price=11200000.0,
        sba=1300.0,
        carpet=897.0,
        balcony=104.0,
        common_area=299.0,
        base_rate=8600.0
    )
    assert res.value["rate_per_sba"] == 8615.38
    assert res.value["rate_per_carpet"] == 12486.06
    assert res.value["usable_area_sqft"] == 1001.0  # 897 + 104
    assert res.value["rate_per_usable"] == 11188.81  # 11200000 / 1001
    assert res.value["carpet_efficiency_pct"] == 69.0  # 897 / 1300
    assert res.value["balcony_sqft"] == 104.0
    assert res.value["balcony_pct"] == 8.0  # 104 / 1300
    assert res.value["common_area_sqft"] == 299.0
    assert res.value["common_area_pct"] == 23.0  # 299 / 1300
    assert res.value["usable_efficiency_pct"] == 77.0  # 1001 / 1300
    assert res.value["area_breakdown_status"] == "verified_separate_breakdown"

    # Fallback when common_area or balcony is missing:
    res_fallback = usable_foot(
        price=11200000.0,
        sba=1300.0,
        carpet=897.0,
        balcony=None,
        common_area=None
    )
    assert res_fallback.value["area_between_super_builtup_and_carpet_sqft"] == 403.0
    assert res_fallback.value["area_between_super_builtup_and_carpet_pct"] == 31.0
    assert res_fallback.value["common_area_sqft"] is None
    assert res_fallback.value["area_breakdown_status"] == "unseparated_area_difference"


def test_marginal_cost():
    """Expected: 12,500 per extra carpet sq ft."""
    res = marginal_cost(
        price_a=11200000,
        price_b=16200000,
        carpet_a=897,
        carpet_b=1297
    )
    assert res.value is not None
    assert res.value["delta_price"] == 5000000
    assert res.value["delta_carpet_sqft"] == 400
    assert res.value["marginal_rate_per_sqft"] == 12500.0


def test_offer_skew():
    """Expected: floor 24 saving is 20x floor 5 saving."""
    res = offer_skew(
        floor_rise_per_sqft=25.0,
        start_floor=4,
        area_sqft=1300,
        floors_list=[5, 24]
    )
    assert res.value is not None
    savings = res.value["savings_by_floor"]
    assert savings[5] == 32500.0
    assert savings[24] == 650000.0
    assert res.value["ratio"] == 20.0
    assert res.value["start_floor_used"] == 4
    assert "charges start above floor 4" in res.value["ratio_text"]


def test_density_per_floor(sample_blocks):
    """Expected: Towers C and F 11.7 homes per floor, A and D about 9.8; each tower 78 homes per lift."""
    res = density_per_floor(blocks=sample_blocks, declared_units_per_floor=10)
    assert res.value is not None
    towers_map = {t["name"]: t for t in res.value["towers"]}
    
    assert towers_map["Tower C"]["homes_per_floor"] == 11.7
    assert towers_map["Tower F"]["homes_per_floor"] == 11.7
    assert round(towers_map["Tower A"]["homes_per_floor"], 1) == 9.8
    assert round(towers_map["Tower D"]["homes_per_floor"], 1) == 9.8

    for t in res.value["towers"]:
        assert round(t["homes_per_lift"]) == 78

    assert "Tower C" in res.value["odd_one_out_towers"]
    assert "Tower F" in res.value["odd_one_out_towers"]


def test_consistency(sample_blocks):
    """Expected: tower totals 1,406 vs floors x 10 = 1,320 (gap 86)."""
    res = consistency(blocks=sample_blocks, declared_total_units=1406)
    assert res.value is not None
    assert res.value["sum_tower_units"] == 1406
    assert res.value["floors_times_declared_units"] == 1320
    assert res.value["gap_floors_vs_tower_units"] == 86


def test_consistency_uncertain_semantics():
    """When declared units per floor conflicts by >1.5x, report semantic uncertainty rather than internal discrepancy."""
    conflicting_blocks = [
        {"name": "Tower 1", "floors": 24, "units_count": 234, "declared_units_per_floor": 4}
    ]
    res = consistency(blocks=conflicting_blocks, declared_total_units=234)
    assert res.value is not None
    assert res.value["semantic_uncertain"] is True
    assert res.value["assumed_semantic"] == "units_per_core_or_wing"
    assert "units_per_floor (4) differs from computed" in res.value["semantic_note"]


def test_basement_footprint():
    """Expected: with 1 car per home and 30 sq m per slot, about 42,180 sq m, 63% of site per level."""
    res = basement_footprint(unit_count=1406, site_acres=16.5)
    assert res.value is not None
    assert res.value["required_parking_sqm"] == 42180.0
    assert round(res.value["share_of_site_pct"]) == 63
    assert "cars_per_home" in res.assumptions
    assert "sqm_per_parking_slot" in res.assumptions


def test_annual_commute_hours():
    """Expected: office 100 h, school 200 h with registry defaults."""
    office_res = annual_commute_hours(one_way_minutes=12, destination_type="office")
    assert office_res.value is not None
    assert office_res.value["annual_hours"] == 100
    assert "working_days_per_year" in office_res.assumptions
    assert "trips_per_work_day" in office_res.assumptions

    school_res = annual_commute_hours(one_way_minutes=15, destination_type="school")
    assert school_res.value is not None
    assert school_res.value["annual_hours"] == 200
    assert "school_days_per_year" in school_res.assumptions
    assert "trips_per_school_day" in school_res.assumptions


def test_implied_speed():
    res = implied_speed(distance_km=2.8, minutes=12)
    assert res.value is not None
    assert res.value["speed_kmh"] == 14.0


def test_true_cheque():
    res = true_cheque(
        headline=11200000,
        floor=12,
        sba=1300,
        floor_rise=25,
        parking=300000,
        corpus=195000,
        maintenance_deposit=94000,
        start_floor=4
    )
    assert res.value is not None
    assert res.value["floor_rise_total"] == 260000.0
    assert res.value["total_builder_extras"] == 849000.0
    assert res.value["known_total"] == 12049000.0
    assert len(res.value["unconfirmed_items"]) >= 2


def test_straight_line_distances():
    """Tests Euclidean distances from towers to clubhouse and farthest/nearest ratio."""
    entrances = {
        "Tower A": {"x": 50.0, "y": 50.0},
        "Tower B": {"x": 100.0, "y": 100.0},
        "Tower C": {"x": 250.0, "y": 200.0}
    }
    clubhouse = {"x": 50.0, "y": 20.0}
    res = straight_line_distances(tower_entrances=entrances, clubhouse_xy=clubhouse)
    assert res.value is not None
    assert res.value["nearest_tower"] == "Tower A"
    assert res.value["nearest_distance_m"] == 30.0
    assert res.value["farthest_tower"] == "Tower C"
    assert res.value["farthest_distance_m"] == 269.07
    assert res.value["ratio"] == round(269.07 / 30.0, 2)

    # Missing coordinates test
    res_missing = straight_line_distances(tower_entrances=entrances, clubhouse_xy=None)
    assert res_missing.value is None
    assert "clubhouse_xy" in res_missing.missing_inputs


def test_claim_ledger():
    """Tests auditing of marketing claims against verified data fields."""
    claims = [
        {"claim": "All towers face East", "target_field": "orientation", "expected_val": "East"},
        {"claim": "100% DG power backup", "target_field": "dg_backup", "expected_val": "100%"},
        {"claim": "Possession by Dec 2026", "target_field": "possession_date", "expected_val": "Dec 2026"},
        {"claim": "Olympic sized swimming pool", "target_field": "swimming_pool_spec", "expected_val": "Olympic"}
    ]
    verified_data = {
        "orientation": "East / West",
        "dg_backup": "100%",
        "possession_date": "Jun 2027"
    }
    res = claim_ledger(claims=claims, data=verified_data)
    assert res.value is not None
    assert res.value["supported_count"] == 1
    assert res.value["partly_count"] == 1
    assert res.value["contradicted_count"] == 1
    assert res.value["uncheckable_count"] == 1


# ==============================================================================
# EDGE CASES REQUESTED IN REVIEW:
# ==============================================================================

def test_edge_cases_zero_divisors():
    """Carpet 0, passenger lifts 0, minutes 0 must be handled safely without ZeroDivisionError."""
    # Carpet = 0 in usable_foot
    res_foot = usable_foot(price=11200000, sba=1300, carpet=0)
    assert res_foot.value is not None
    assert res_foot.value["rate_per_carpet"] == 0.0
    assert res_foot.value["carpet_efficiency_pct"] == 0.0

    # Lifts = 0 and floors = 0 in density_per_floor
    zero_block = [{"name": "Tower X", "floors": 0, "units_count": 100, "passenger_lifts": 0}]
    res_density = density_per_floor(blocks=zero_block)
    assert res_density.value is not None
    assert res_density.value["towers"][0]["homes_per_floor"] == 0.0
    assert res_density.value["towers"][0]["homes_per_lift"] == 0.0

    # Minutes = 0 in implied_speed
    res_speed = implied_speed(distance_km=10.0, minutes=0)
    assert res_speed.value is None
    assert "minutes must be > 0" in res_speed.missing_inputs


def test_edge_case_floor_below_start_floor():
    """A floor below the floor-rise start floor must give a ₹0 saving."""
    res = offer_skew(
        floor_rise_per_sqft=25.0,
        start_floor=4,
        area_sqft=1300,
        floors_list=[2, 3, 4, 5]
    )
    assert res.value is not None
    savings = res.value["savings_by_floor"]
    assert savings[2] == 0.0
    assert savings[3] == 0.0
    assert savings[4] == 0.0
    assert savings[5] == 32500.0


def test_edge_case_assumption_override():
    """Assumption override: cars_per_home=2 doubles the basement area and appears in assumptions_used."""
    res_base = basement_footprint(unit_count=1406, site_acres=16.5)
    assert res_base.value["required_parking_sqm"] == 42180.0

    res_override = basement_footprint(unit_count=1406, site_acres=16.5, cars_per_home=2.0)
    assert res_override.value["required_parking_sqm"] == 84360.0
    assert res_override.value["required_parking_sqm"] == 2 * res_base.value["required_parking_sqm"]
    assert "cars_per_home" in res_override.assumptions

    res_override_dict = basement_footprint(
        unit_count=1406,
        site_acres=16.5,
        assumptions_override={"cars_per_home": 2.0}
    )
    assert res_override_dict.value["required_parking_sqm"] == 84360.0
    assert "cars_per_home" in res_override_dict.assumptions


def test_edge_case_partially_filled_project():
    """Partially filled inputs must return missing_inputs with exactly the absent fields."""
    res_partial = marginal_cost(
        price_a=11200000,
        price_b=None,
        carpet_a=897,
        carpet_b=None
    )
    assert res_partial.value is None
    assert set(res_partial.missing_inputs) == {"price_b", "carpet_b"}

    res_partial_cheque = true_cheque(headline=None, floor=12, sba=None)
    assert res_partial_cheque.value is None
    assert set(res_partial_cheque.missing_inputs) == {"headline", "sba"}


def test_basement_plausibility_guards():
    """Item 1: Plausibility guard test. Share > 400% or homes per acre outside 5-300 returns status 'implausible_input'."""
    # 0.04 acres for 1406 units -> 35,150 homes/acre (implausible)
    res_implausible = basement_footprint(unit_count=1406, site_acres=0.04)
    assert res_implausible.status == "implausible_input"
    assert res_implausible.value is None
    assert "site_acres" in res_implausible.missing_inputs

    # 16.5 acres for 1406 units -> 85.2 homes/acre (plausible) -> share 63.2%
    res_plausible = basement_footprint(unit_count=1406, site_acres=16.5)
    assert res_plausible.status == "ok"
    assert res_plausible.value is not None
    assert abs(res_plausible.value["share_of_site_pct"] - 63.2) <= 0.5


def test_check_floor_rise_conflict():
    """Item 3: Detects conflicting floor rise rates between additional_charges and pricing_breakdown."""
    # Conflicting: 50 in text vs 25 in breakdown
    add_charges = "Facing: ₹100/sqft, Floor rise: ₹50/sqft per floor, View: ₹100/sqft"
    conflict = check_floor_rise_conflict(add_charges, 25.0)
    assert conflict is not None
    assert conflict["status"] == "conflict"
    assert conflict["values"]["additional_charges"] == 50.0
    assert conflict["values"]["pricing_breakdown.floor_rise"] == 25.0

    # Non-conflicting: 25 in text vs 25 in breakdown
    add_charges_match = "Facing: ₹100/sqft, Floor rise: ₹25/sqft per floor"
    no_conflict = check_floor_rise_conflict(add_charges_match, 25.0)
    assert no_conflict is None


def test_true_cheque_missing_values_null_and_included_items():
    """Item 4: Missing values must be null (None), not 0.0, and known_total must list included_items."""
    res = true_cheque(
        headline=11200000.0,
        floor=12,
        sba=1300.0,
        floor_rise=25.0,
        facing_premium=130000.0,
        view_premium=130000.0,
        parking=None,             # Missing
        corpus=156000.0,
        maintenance_deposit=None,  # Missing
        start_floor=4
    )
    assert res.value is not None
    assert res.value["parking"] is None
    assert res.value["maintenance_deposit"] is None
    assert "parking (not captured)" in res.value["unconfirmed_items"]
    assert "maintenance_deposit (not captured)" in res.value["unconfirmed_items"]
    assert res.value["included_items"] == ["headline", "floor_rise", "facing_premium (scenario)", "view_premium (scenario)", "corpus_fund"]


def test_property_1_regression_packets():
    """Item 1 & 4: Packet-level regression tests on Property 1 data."""
    from app.seed import seed_database
    from app.database import SessionLocal
    from app.models import Property
    from app.routers.feature_intelligence import property_model_to_dict
    from app.services.packet_builder import build_calculation_packet

    db = SessionLocal()
    try:
        prop = db.query(Property).filter(Property.id == 1).first()
        if not prop:
            seed_database(db)
            prop = db.query(Property).filter(Property.id == 1).first()

        prop_dict = property_model_to_dict(prop)

        # 1. Master Plan: Basement share must be 63.2% +/- 0.5
        mp_packet = build_calculation_packet(prop_dict, module="master_plan")
        bf_res = next((r for r in mp_packet["results"] if r["id"] == "basement_footprint"), None)
        assert bf_res is not None
        assert abs(bf_res["value"]["share_of_site_pct"] - 63.2) <= 0.5
        assert bf_res["value"]["site_sqm"] == 66773.13

        # 2. Pricing: Conflict in floor rise (50 vs 25) detected in data_gaps
        pricing_packet = build_calculation_packet(prop_dict, module="pricing")
        gap_fr = next((g for g in pricing_packet["data_gaps"] if g.get("field") == "floor_rise_rate"), None)
        assert gap_fr is not None
        assert gap_fr["status"] == "conflict"

        # Neither 50 nor 25 should be silently picked as canonical
        assert next((r for r in pricing_packet["results"] if r["id"] == "offer_skew"), None) is None
        assert next((r for r in pricing_packet["results"] if r["id"] == "true_cheque"), None) is None
        # Scenarios for each value must be emitted
        assert next((r for r in pricing_packet["results"] if r["id"] == "offer_skew_scenario_rate_25"), None) is not None
        assert next((r for r in pricing_packet["results"] if r["id"] == "offer_skew_scenario_rate_50"), None) is not None
        assert next((r for r in pricing_packet["results"] if r["id"] == "true_cheque_scenario_rate_25"), None) is not None
        assert next((r for r in pricing_packet["results"] if r["id"] == "true_cheque_scenario_rate_50"), None) is not None

        # 3. Amenities: Pool located on podium/outdoors, not in clubhouse
        amenities_packet = build_calculation_packet(prop_dict, module="amenities")
        ch_res = next((r for r in amenities_packet["results"] if r["id"] == "clubhouse_allocation"), None)
        assert ch_res is not None
        assert ch_res["value"]["sqft_per_home"] == 28.45
        assert ch_res["value"]["clubhouse_amenities_count"] == 7
        assert ch_res["value"]["podium_outdoor_amenities_count"] == 9
        assert "Swimming pool" in ch_res["value"]["podium_outdoor_amenities"]
        assert "Swimming pool" not in ch_res["value"]["clubhouse_amenities"]

        # 4. Sustainability: Rainwater pit dimensions data gap present; no fake storage finding
        sust_packet = build_calculation_packet(prop_dict, module="sustainability")
        rwh_res = next((r for r in sust_packet["results"] if r["id"] == "rainwater_capacity"), None)
        assert rwh_res is None
        rwh_gap = next((g for g in sust_packet["data_gaps"] if "rainwater" in g.get("field", "")), None)
        assert rwh_gap is not None
    finally:
        db.close()


def test_pricing_floor_rise_conflict_scenario_separation():
    """Item 1: Separate fixture proving conflict detection and scenario generation."""
    from app.services.packet_builder import build_calculation_packet

    prop_data = {
        "id": 999,
        "additional_charges": "Facing: ₹100/sqft, Floor rise: ₹50/sqft per floor, Corpus: ₹120/sqft",
        "modules_data": {
            "configurations": [
                {"name": "2 BHK", "price": 11200000.0, "super_built_up_sqft": 1300, "carpet": 897}
            ],
            "pricing_breakdown": {
                "base_rate": 8600.0,
                "floor_rise": 25.0,
                "facing_premium": "₹100 / sq ft",
                "corpus_fund": "₹120 / sq ft"
            }
        }
    }

    packet = build_calculation_packet(prop_data, module="pricing")
    # 1. Must emit conflict data_gap
    conflict_gap = next((g for g in packet["data_gaps"] if g.get("field") == "floor_rise_rate"), None)
    assert conflict_gap is not None
    assert conflict_gap["status"] == "conflict"
    assert conflict_gap["values"]["additional_charges"] == 50.0
    assert conflict_gap["values"]["pricing_breakdown.floor_rise"] == 25.0

    # 2. Must NOT compute single canonical offer_skew or true_cheque
    assert next((r for r in packet["results"] if r["id"] == "offer_skew"), None) is None
    assert next((r for r in packet["results"] if r["id"] == "true_cheque"), None) is None

    # 3. Must return labelled scenario results for both values
    sk25 = next((r for r in packet["results"] if r["id"] == "offer_skew_scenario_rate_25"), None)
    sk50 = next((r for r in packet["results"] if r["id"] == "offer_skew_scenario_rate_50"), None)
    assert sk25 is not None and sk25["status"] == "scenario"
    assert sk50 is not None and sk50["status"] == "scenario"

    tc25 = next((r for r in packet["results"] if r["id"] == "true_cheque_scenario_rate_25"), None)
    tc50 = next((r for r in packet["results"] if r["id"] == "true_cheque_scenario_rate_50"), None)
    assert tc25 is not None and tc25["status"] == "scenario"
    assert tc50 is not None and tc50["status"] == "scenario"


def test_isb_higher_education_commute_scenario():
    """Item 5: Commute formula must not include km, and ISB must be higher education scenario."""
    from app.services.engines.commute_engine import annual_commute_hours

    # ISB: 25 mins one-way, higher_education
    res = annual_commute_hours(
        one_way_minutes=25.0,
        destination_type="higher_education"
    )
    # 25 * 2 * 220 / 60 = 183.3 hours
    assert res.value["annual_hours"] == 183.3
    assert res.value["trips_per_day"] == 2
    assert res.value["days_per_year"] == 220
    assert "trips_per_work_day" in res.assumptions
    assert "college_days_per_year" in res.assumptions
    assert "college_commute_scenario" in res.assumptions
    assert res.status == "scenario"
    assert "km" not in res.formula_text


def test_assumptions_registry_verified_flags():
    """Item 4: Every entry in registry must have verified=False until human audit."""
    from app.services.engines.assumptions import ASSUMPTIONS_REGISTRY

    assert len(ASSUMPTIONS_REGISTRY) >= 8
    for a_id, assump in ASSUMPTIONS_REGISTRY.items():
        assert assump.verified is False, f"Assumption {a_id} must have verified=False"


def test_master_plan_zero_bug_regression():
    """
    Zero Bug Regression Test on Property 1:
    The Master plan card previously produced 'Floors average 0.0 units per core'
    and '0.0 homes per level'.
    Verify that on Property 1, density_per_floor never emits 0.0 units per floor,
    and returns positive genuine metrics (approx 9.75 units/floor, 78 homes/lift).
    """
    from app.database import SessionLocal
    from app.models import Property
    from app.routers.feature_intelligence import property_model_to_dict
    from app.services.packet_builder import build_calculation_packet

    db = SessionLocal()
    prop = db.query(Property).filter(Property.id == 1).first()
    db.close()

    assert prop is not None, "Property 1 must exist in database"
    prop_dict = property_model_to_dict(prop)
    packet = build_calculation_packet(prop_dict, "master_plan")

    density_res = next((r for r in packet["results"] if r.get("id") == "density_per_floor"), None)
    assert density_res is not None, "density_per_floor must be computed for Property 1"
    val = density_res["value"]
    assert val is not None

    # Assert avg units per floor is positive and realistic (~9.76)
    assert val["units_per_floor"] is not None
    assert val["units_per_floor"] > 0
    assert 9.0 <= val["units_per_floor"] <= 11.0, f"Expected realistic ~9.76, got {val['units_per_floor']}"

    # Assert homes per lift is positive and realistic (~78.1)
    assert val["total_homes_per_lift"] is not None
    assert val["total_homes_per_lift"] > 0
    assert 70 <= val["total_homes_per_lift"] <= 85, f"Expected realistic ~78.1, got {val['total_homes_per_lift']}"

    # Assert towers analysis contains no 0.0 counts
    for tower in val["towers"]:
        assert tower["homes_per_floor"] is not None and tower["homes_per_floor"] > 0
        assert tower["homes_per_lift"] is not None and tower["homes_per_lift"] > 0


def test_density_per_floor_zero_and_missing_guards():
    """
    Guard: when blocks is None or missing, density_per_floor safely returns missing_inputs.
    When a count is zero, engines compute safely without throwing exceptions.
    """
    res_none = density_per_floor(blocks=None)
    assert res_none.value is None
    assert "blocks" in res_none.missing_inputs

    zero_blocks = [
        {"name": "Tower A", "floors": 0, "units_count": 0, "passenger_lifts": 0}
    ]
    res_zero = density_per_floor(blocks=zero_blocks)
    assert res_zero.value is not None
    assert res_zero.value["towers"][0]["homes_per_floor"] == 0.0
    assert res_zero.value["total_homes_per_lift"] == 0.0

