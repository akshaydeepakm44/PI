import pytest
from app.services.finding_validator import validate_finding, parse_indian_number

@pytest.fixture
def sample_pricing_packet():
    return {
        "property_id": 1,
        "module": "pricing",
        "results": [
            {
                "id": "usable_foot_2bhk",
                "value": {
                    "rate_per_sba": 8615.38,
                    "rate_per_carpet": 12486.06,
                    "carpet_efficiency_pct": 69.0,
                    "common_area_pct": 31.0,
                    "common_area_sqft": 403
                },
                "inputs": {"price": 11200000, "sba": 1300, "carpet": 897, "base_rate": 8600}
            },
            {
                "id": "marginal_cost",
                "value": {
                    "delta_price": 5000000,
                    "delta_carpet_sqft": 400,
                    "marginal_rate_per_sqft": 12500.0,
                    "base_home_carpet_rate": 12486.06
                },
                "inputs": {"price_a": 11200000, "price_b": 16200000, "carpet_a": 897, "carpet_b": 1297}
            },
            {
                "id": "offer_skew",
                "value": {
                    "savings_by_floor": {"5": 32500.0, "24": 650000.0},
                    "ratio": 20.0,
                    "min_saving": 32500.0,
                    "max_saving": 650000.0,
                    "start_floor_used": 4
                },
                "inputs": {"floor_rise_per_sqft": 25, "start_floor": 4, "area_sqft": 1300}
            },
            {
                "id": "basement_footprint",
                "value": {
                    "required_parking_sqm": 42180.0,
                    "site_sqm": 66773.13,
                    "share_of_site_pct": 63.2
                },
                "inputs": {"unit_count": 1406, "site_acres": 16.5}
            },
            {
                "id": "commute_dlf",
                "value": {
                    "equivalent_40h_work_weeks": 4.6
                },
                "inputs": {"one_way_minutes": 22.0}
            }
        ],
        "assumptions": {
            "floor_height_m": {"value": 3.0, "unit": "meters"},
            "cars_per_home": {"value": 1.0, "unit": "slots/home"}
        },
        "data_gaps": [
            {"field": "facing_premium", "module": "pricing", "description": "Seller needs to supply facing premium"}
        ]
    }


def test_parse_indian_number():
    """Verify Indian currency units and formatting parsing."""
    assert parse_indian_number("₹6.5 lakh") == 650000.0
    assert parse_indian_number("6.5 lakh") == 650000.0
    assert parse_indian_number("6.5lakhs") == 650000.0
    assert parse_indian_number("₹6.5 L") == 650000.0
    assert parse_indian_number("Rs 50 L") == 5000000.0
    assert parse_indian_number("₹1.12 Cr") == 11200000.0
    assert parse_indian_number("1.12 crore") == 11200000.0
    assert parse_indian_number("₹50 L") == 5000000.0
    assert parse_indian_number("6,50,000") == 650000.0
    assert parse_indian_number("12,500") == 12500.0
    assert parse_indian_number("20x") == 20.0
    assert parse_indian_number("69%") == 69.0


def test_parse_litres_vs_lakh():
    """'135 L' with NO currency must be parsed as 135.0 (litres), NOT 135 lakh."""
    res_litres = parse_indian_number("135 L")
    assert res_litres == 135.0
    assert res_litres != 13500000.0

    res_lakh = parse_indian_number("₹135 L")
    assert res_lakh == 13500000.0


def test_validator_significant_digit_precision(sample_pricing_packet):
    """
    Precision rules:
    - '₹6.5 lakh' matches 650000
    - '₹12,500' matches 12486.06
    - '₹12,550' is rejected
    - '63%' matches 63.2
    - '5%' is rejected against 4.6 (error 8.7% > 0.5%)
    """
    # 1. ₹6.5 lakh matches 650000
    finding_6_5 = {
        "analytical_move": "scale_the_offer",
        "claim": "Floor 24 avoids ₹6.5 lakh in floor rise.",
        "why_it_follows": "At ₹25 per sq ft above floor 4, the saving is ₹6.5 lakh.",
        "what_it_changes": "Worth confirming waiver application on upper floors.",
        "flip_condition": "This flips if a floor rise cap is in place.",
        "assumptions_used": []
    }
    assert validate_finding(finding_6_5, sample_pricing_packet).is_valid is True

    # 2. ₹12,500 matches 12486.06
    finding_12500 = {
        "analytical_move": "reframe_the_unit",
        "claim": "The unit space costs ₹12,500 per carpet foot.",
        "why_it_follows": "The rate per carpet sq ft rounds to ₹12,500.",
        "what_it_changes": "Direct comparison with market baseline.",
        "flip_condition": "This flips if carpet area is recalculated.",
        "assumptions_used": []
    }
    assert validate_finding(finding_12500, sample_pricing_packet).is_valid is True

    # 3. ₹12,550 is rejected against 12486.06
    finding_12550 = {
        "analytical_move": "reframe_the_unit",
        "claim": "The unit space costs ₹12,550 per carpet foot.",
        "why_it_follows": "At ₹12,550 per carpet foot, costs escalate.",
        "what_it_changes": "Higher outgo.",
        "flip_condition": "This flips if discounts are offered.",
        "assumptions_used": []
    }
    res_12550 = validate_finding(finding_12550, sample_pricing_packet)
    assert res_12550.is_valid is False
    assert any("12,550" in err for err in res_12550.errors)

    # 4. 63% matches 63.2
    finding_63 = {
        "analytical_move": "follow_the_implication",
        "claim": "Basement spans 63% of the land parcel.",
        "why_it_follows": "The parking footprint covers 63% of the site per level.",
        "what_it_changes": "Worth confirming basement excavation depth with developer.",
        "flip_condition": "This flips if fewer cars per home are allocated.",
        "assumptions_used": ["cars_per_home"]
    }
    assert validate_finding(finding_63, sample_pricing_packet).is_valid is True

    # 5. 5% is rejected against 4.6 (error 8.7% > 0.5%)
    finding_5 = {
        "analytical_move": "convert_to_time",
        "claim": "Commute consumes 5% of annual working time.",
        "why_it_follows": "The commute represents 5% of working weeks.",
        "what_it_changes": "Time loss.",
        "flip_condition": "This flips if work from home applies.",
        "assumptions_used": []
    }
    res_5 = validate_finding(finding_5, sample_pricing_packet)
    assert res_5.is_valid is False
    assert any("Invented or unmatched number '5%'" in err for err in res_5.errors)


def test_validator_small_whole_numbers_and_ordinals(sample_pricing_packet):
    """
    - Bare '20x' not in packet is rejected.
    - '24th floor' and '21 Dec' pass via ordinal/date exemption.
    """
    # Packet has 20.0 from offer_skew. Create a packet WITHOUT 20.0:
    packet_no_20 = {
        "property_id": 1,
        "module": "pricing",
        "results": [sample_pricing_packet["results"][0]],  # only usable_foot
        "assumptions": {},
        "data_gaps": []
    }

    # Bare 20x not in packet: must be rejected
    bare_20x = {
        "analytical_move": "scale_the_offer",
        "claim": "There is a 20x gap between tiers.",
        "why_it_follows": "A 20x multiplier separates the tiers at ₹12,486.06 per carpet foot.",
        "what_it_changes": "Disproportionate benefit.",
        "flip_condition": "This flips if pricing is flat.",
        "assumptions_used": []
    }
    res_bare = validate_finding(bare_20x, packet_no_20)
    assert res_bare.is_valid is False
    assert any("20x" in err for err in res_bare.errors)

    # Ordinals '24th floor' and date '21 Dec' pass even if 24 and 21 are not results
    ordinal_date_finding = {
        "analytical_move": "reframe_the_unit",
        "claim": "Unit on the 24th floor incurs ₹12,486 per sq ft on 21 Dec.",
        "why_it_follows": "At ₹12,486.06 per carpet foot on the 24th floor, winter sun enters on 21 Dec.",
        "what_it_changes": "Worth confirming seasonal rate variation.",
        "flip_condition": "This flips if tower alignment changes.",
        "assumptions_used": []
    }
    res_ord = validate_finding(ordinal_date_finding, sample_pricing_packet)
    assert res_ord.is_valid is True


def test_validator_rejects_missing_flip_condition(sample_pricing_packet):
    finding_no_flip = {
        "analytical_move": "scale_the_offer",
        "claim": "The floor rise waiver saves ₹6.5 lakh on upper floors.",
        "why_it_follows": "Floor 24 avoids ₹6.5 lakh compared to ₹32,500 on floor 5.",
        "what_it_changes": "Upper floor buyers gain significantly.",
        "flip_condition": "",
        "assumptions_used": []
    }
    res = validate_finding(finding_no_flip, sample_pricing_packet)
    assert res.is_valid is False
    assert any("flip_condition is missing or empty" in err for err in res.errors)


def test_validator_rejects_banned_words(sample_pricing_packet):
    banned_finding = {
        "analytical_move": "reframe_the_unit",
        "claim": "This 2 BHK is the best investment on the market.",
        "why_it_follows": "The rate is ₹12,500 per sq ft and guaranteed to appreciate.",
        "what_it_changes": "You should buy immediately for completely safe returns.",
        "flip_condition": "This flips if market conditions change.",
        "assumptions_used": []
    }
    res = validate_finding(banned_finding, sample_pricing_packet)
    assert res.is_valid is False
    assert any("Contains banned sales advice" in err for err in res.errors)


def test_validator_rejects_unlisted_assumption_number(sample_pricing_packet):
    finding_untagged_assumption = {
        "analytical_move": "follow_the_implication",
        "claim": "Towers reach significant elevation.",
        "why_it_follows": "Assuming 3.0 meters per floor, a 24th floor tower stands tall.",
        "what_it_changes": "Morning shadows reach far.",
        "flip_condition": "This flips if floor heights are 2.8 meters.",
        "assumptions_used": []
    }
    res = validate_finding(finding_untagged_assumption, sample_pricing_packet)
    assert res.is_valid is False
    assert any("Assumption value" in err and "floor_height_m" in err for err in res.errors)


def test_validator_rejects_claim_about_data_gap(sample_pricing_packet):
    gap_finding = {
        "analytical_move": "size_the_unknowns",
        "claim": "Facing premium is officially verified at standard rates.",
        "why_it_follows": "The facing_premium adds ₹100 per sq ft to base cost.",
        "what_it_changes": "Buyers should budget for it.",
        "flip_condition": "This flips if facing charges are waived.",
        "assumptions_used": []
    }
    res = validate_finding(gap_finding, sample_pricing_packet)
    assert res.is_valid is False
    assert any("facing_premium" in err and "data_gaps" in err for err in res.errors)


def test_validator_rejects_empty_derivation_restatement():
    empty_packet = {
        "property_id": 1,
        "module": "empty",
        "results": [],
        "assumptions": {},
        "data_gaps": []
    }
    raw_restatement = {
        "analytical_move": "reframe_the_unit",
        "claim": "The price is stated on the brochure.",
        "why_it_follows": "The home costs what the seller posted.",
        "what_it_changes": "Nothing is changed.",
        "flip_condition": "This flips if price changes.",
        "assumptions_used": []
    }
    res = validate_finding(raw_restatement, empty_packet)
    assert res.is_valid is False
    assert any("only restates a raw field" in err for err in res.errors)


def test_validator_sig_fig_vs_tolerance_isolated():
    """
    Explicit test isolating interaction between 0.5% tolerance and significant digits:
    1. Packet with only 12486.06:
       - '₹12,550' is rejected against 12486.06 (both 4-sig-fig round 12490 != 12550 AND rel error 0.51% > 0.5%).
    2. Packet with marginal_cost = 12500.0:
       - '₹12,500' is accepted because packet explicitly contains 12500.0.
       - '₹12,550' is rejected against 12500.0 (even though rel error 0.4% <= 0.5%, 4 sig-figs round 12500 != 12550).
    3. Commute with 4.6 work weeks:
       - '5%' is rejected against 4.6 (rel error 8.7% > 0.5%).
    4. Basement footprint 63.2%:
       - '63%' is accepted against 63.2% (rel error 0.31% <= 0.5% and 2 sig-figs round 63.2 -> 63.0).
    5. Bare '20x':
       - '20x' not in packet is rejected (multiplier is not exempt as date/ordinal).
    """
    packet_12486_only = {
        "property_id": 1,
        "module": "pricing",
        "results": [
            {
                "id": "usable_foot",
                "value": {"rate_per_carpet": 12486.06},
                "inputs": {}
            }
        ],
        "assumptions": {},
        "data_gaps": []
    }
    # 1. 12,550 rejected against 12486.06
    f_12550 = {
        "analytical_move": "reframe_the_unit",
        "claim": "Cost is ₹12,550 per sq ft.",
        "why_it_follows": "At ₹12,550 per sq ft rate.",
        "what_it_changes": "Budget impact.",
        "flip_condition": "Flips if rates change.",
        "assumptions_used": []
    }
    res_12550 = validate_finding(f_12550, packet_12486_only)
    assert res_12550.is_valid is False
    assert any("12,550" in err for err in res_12550.errors)

    # 2. 12,500 accepted when packet has 12500.0
    packet_12500 = {
        "property_id": 1,
        "module": "pricing",
        "results": [
            {
                "id": "marginal_cost",
                "value": {"marginal_rate_per_sqft": 12500.0},
                "inputs": {}
            }
        ],
        "assumptions": {},
        "data_gaps": []
    }
    f_12500 = {
        "analytical_move": "reframe_the_unit",
        "claim": "Cost is ₹12,500 per sq ft.",
        "why_it_follows": "At ₹12,500 per sq ft rate.",
        "what_it_changes": "Budget impact.",
        "flip_condition": "Flips if rates change.",
        "assumptions_used": []
    }
    res_12500 = validate_finding(f_12500, packet_12500)
    assert res_12500.is_valid is True

    # 3. 5% rejected against 4.6
    packet_4_6 = {
        "property_id": 1,
        "module": "commute",
        "results": [{"id": "annual_commute_hours", "value": {"equivalent_40h_work_weeks": 4.6}, "inputs": {}}],
        "assumptions": {},
        "data_gaps": []
    }
    f_5pct = {
        "analytical_move": "convert_to_time",
        "claim": "Consumes 5% of annual work.",
        "why_it_follows": "Commute equals 5% of working time.",
        "what_it_changes": "Personal time loss.",
        "flip_condition": "Flips if remote work allowed.",
        "assumptions_used": []
    }
    res_5pct = validate_finding(f_5pct, packet_4_6)
    assert res_5pct.is_valid is False
    assert any("5%" in err for err in res_5pct.errors)

    # 4. 63% accepted against 63.2
    packet_63_2 = {
        "property_id": 1,
        "module": "master_plan",
        "results": [{"id": "basement_footprint", "value": {"share_of_site_pct": 63.2}, "inputs": {}}],
        "assumptions": {},
        "data_gaps": []
    }
    f_63pct = {
        "analytical_move": "follow_the_implication",
        "claim": "Basement takes 63% of the land.",
        "why_it_follows": "Footprint covers 63% of the site.",
        "what_it_changes": "Excavation scale.",
        "flip_condition": "Flips if parking ratio is reduced.",
        "assumptions_used": []
    }
    res_63pct = validate_finding(f_63pct, packet_63_2)
    assert res_63pct.is_valid is True

    # 5. Bare 20x not in packet rejected
    packet_no_20x = {
        "property_id": 1,
        "module": "pricing",
        "results": [{"id": "marginal_cost", "value": {"marginal_rate_per_sqft": 12500.0}, "inputs": {}}],
        "assumptions": {},
        "data_gaps": []
    }
    f_20x = {
        "analytical_move": "scale_the_offer",
        "claim": "There is a 20x gap between tiers.",
        "why_it_follows": "A 20x difference separates the tiers.",
        "what_it_changes": "Skewed benefit.",
        "flip_condition": "Flips if pricing is linear.",
        "assumptions_used": []
    }
    res_20x = validate_finding(f_20x, packet_no_20x)
    assert res_20x.is_valid is False
    assert any("20x" in err for err in res_20x.errors)


def test_validator_tolerance_boundary():
    """
    Precision boundary tests:
    - Target 10,040 (0.40% diff): written as 10,000 matches within 0.5% tolerance.
    - Target 10,060 (0.60% diff): written as 10,000 exceeds 0.5% tolerance and is rejected.
    """
    packet_inside = {
        "property_id": 1,
        "module": "pricing",
        "results": [{"id": "marginal_cost", "value": 10040.0, "inputs": {}}],
        "assumptions": {},
        "data_gaps": []
    }
    finding_10k = {
        "analytical_move": "reframe_the_unit",
        "claim": "Cost per unit is 10,000 units.",
        "why_it_follows": "At 10,000 the threshold is reached.",
        "what_it_changes": "Budget impact.",
        "flip_condition": "Flips if rates change.",
        "assumptions_used": []
    }
    assert validate_finding(finding_10k, packet_inside).is_valid is True

    packet_outside = {
        "property_id": 1,
        "module": "pricing",
        "results": [{"id": "marginal_cost", "value": 10060.0, "inputs": {}}],
        "assumptions": {},
        "data_gaps": []
    }
    res_outside = validate_finding(finding_10k, packet_outside)
    assert res_outside.is_valid is False
    assert any("10,000" in err for err in res_outside.errors)


# ==============================================================================
# UPGRADE 5 TESTS (Requested in review):
# ==============================================================================

def test_validator_flip_condition_numbers_checked(sample_pricing_packet):
    """5a. Check numbers in flip_condition: reject ungrounded '2.5 m/s' or '2.5' in flip_condition."""
    finding_invented_flip = {
        "analytical_move": "reframe_the_unit",
        "claim": "The unit space costs ₹12,486.06 per carpet foot.",
        "why_it_follows": "At ₹12,486.06 per carpet foot with 897 carpet sqft, the rate matches usable foot.",
        "what_it_changes": "Clear comparison for buyers.",
        "flip_condition": "This flips if the builder proves lift speeds exceed 2.5 m/s.",
        "assumptions_used": []
    }
    res = validate_finding(finding_invented_flip, sample_pricing_packet)
    assert res.is_valid is False
    assert any("2.5" in err for err in res.errors)


def test_validator_reject_norm_and_benchmark_words(sample_pricing_packet):
    """5b. Reject benchmark/norm words ('typical', 'standard', 'mandatory', 'low-rise') unless tied to verified assumption."""
    finding_with_norm = {
        "analytical_move": "reframe_the_unit",
        "claim": "This project incurs mandatory builder charges.",
        "why_it_follows": "At ₹12,486.06 per carpet foot, typical low-rise standards are exceeded.",
        "what_it_changes": "Budget impact.",
        "flip_condition": "This flips if charges are waived.",
        "assumptions_used": []
    }
    res = validate_finding(finding_with_norm, sample_pricing_packet)
    assert res.is_valid is False
    assert any("benchmark/norm word" in err for err in res.errors)


def test_validator_reject_internal_terms_in_buyer_text(sample_pricing_packet):
    """5c. Reject internal implementation terms: 'packet', 'calculation packet', 'true_cheque', 'rate_per_carpet'."""
    finding_internal = {
        "analytical_move": "reframe_the_unit",
        "claim": "The calculation packet indicates usable space.",
        "why_it_follows": "In true_cheque, the rate_per_carpet is 12486.06 INR/sqft.",
        "what_it_changes": "Impact on buyer.",
        "flip_condition": "This flips if revised.",
        "assumptions_used": []
    }
    res = validate_finding(finding_internal, sample_pricing_packet)
    assert res.is_valid is False
    assert any("internal implementation term" in err for err in res.errors)


def test_validator_reject_numbers_with_more_than_two_decimals(sample_pricing_packet):
    """5d. Reject numbers with more than 2 decimal places (e.g. 11200000.000000002 or 12486.0591)."""
    finding_long_decimal = {
        "analytical_move": "audit_the_claims",
        "claim": "The unit price is ₹11200000.000000002 before taxes.",
        "why_it_follows": "At 12486.06 per carpet foot, the cost is calculated.",
        "what_it_changes": "Budget impact.",
        "flip_condition": "This flips if changed.",
        "assumptions_used": []
    }
    res = validate_finding(finding_long_decimal, sample_pricing_packet)
    assert res.is_valid is False
    assert any("more than 2 decimal places" in err for err in res.errors)


def test_validator_reject_non_gap_why_with_no_result_numbers(sample_pricing_packet):
    """5e. Reject non-gap finding whose why_it_follows contains no number from the results."""
    finding_no_number = {
        "analytical_move": "reframe_the_unit",
        "claim": "The 2 BHK offers competitive space efficiency across typical configurations.",
        "why_it_follows": "The developer provides substantial floor space and proportionate common areas.",
        "what_it_changes": "Buyer can evaluate layout comfort.",
        "flip_condition": "This flips if architectural plans are reconfigured.",
        "assumptions_used": []
    }
    res = validate_finding(finding_no_number, sample_pricing_packet)
    assert res.is_valid is False
    assert any("why_it_follows contains no numerical value from the calculation results" in err for err in res.errors)


def test_validator_reject_editorial_words_in_data_gaps(sample_pricing_packet):
    """5f. Reject editorial phrasing in data-gap findings ('critical', 'significant omission', 'rising adoption')."""
    finding_editorial_gap = {
        "kind": "data_gap",
        "analytical_move": "size_the_unknowns",
        "claim": "Data gap: facing_premium is a critical omission for buyers.",
        "why_it_follows": "Facing premium is unstated, representing a significant omission given rising adoption of premiums.",
        "what_it_changes": "Buyer should verify rates.",
        "flip_condition": "Resolved once builder supplies documents.",
        "assumptions_used": []
    }
    res = validate_finding(finding_editorial_gap, sample_pricing_packet)
    assert res.is_valid is False
    assert any("editorial phrasing" in err for err in res.errors)


def test_validator_reject_crowding_and_wait_time_without_capacity(sample_pricing_packet):
    """3a. Reject crowding, congestion, or wait-time inference without capacity/speed figures in packet."""
    finding_crowding = {
        "claim": "Each passenger lift serves 78 homes in the tower.",
        "why_it_follows": "At 234 homes and 3 passenger lifts, 78 homes per lift is calculated.",
        "what_it_changes": "This density may cause wait times and peak hour congestion.",
        "flip_condition": "The builder provides elevator speed specifications confirming rapid dispatch.",
        "assumptions_used": []
    }
    res = validate_finding(finding_crowding, sample_pricing_packet)
    assert res.is_valid is False
    assert any("crowding, congestion, or wait times" in err for err in res.errors)


def test_validator_reject_imperatives_and_visit_suggestions(sample_pricing_packet):
    """3b. Reject imperatives ('must', 'should', 'advisable', 'visit', 'inspect')."""
    finding_imperative = {
        "claim": "The unit carpet rate is ₹12,486 per sq ft.",
        "why_it_follows": "At ₹11,200,000 for 897 carpet sq ft, rate is ₹12,486 per sq ft.",
        "what_it_changes": "A buyer must verify this rate and visit the property before booking.",
        "flip_condition": "The builder issues a revised price addendum confirming a different rate.",
        "assumptions_used": []
    }
    res = validate_finding(finding_imperative, sample_pricing_packet)
    assert res.is_valid is False
    assert any("directive/imperative phrasing or visit suggestion" in err for err in res.errors)


def test_validator_reject_visit_under_construction(sample_pricing_packet):
    """3c. Reject visit/inspect suggestions when project is under construction."""
    packet_uc = dict(sample_pricing_packet)
    packet_uc["metadata"] = {"construction_status": "Under Construction"}
    finding_visit = {
        "claim": "The unit carpet rate is ₹12,486 per sq ft.",
        "why_it_follows": "At ₹11,200,000 for 897 carpet sq ft, rate is ₹12,486 per sq ft.",
        "what_it_changes": "Buyers should inspect the clubhouse layout in person.",
        "flip_condition": "The builder issues a revised price addendum confirming a different rate.",
        "assumptions_used": []
    }
    res = validate_finding(finding_visit, packet_uc)
    assert res.is_valid is False
    assert any("under construction" in err for err in res.errors)


def test_validator_reject_field_restatement_pool_on_podium(sample_pricing_packet):
    """3d. Drop non-gap finding whose claim is a field value or location with no derived number."""
    finding_pool_restatement = {
        "claim": "The swimming pool is located on the podium outdoors, not inside the clubhouse.",
        "why_it_follows": "The data states the swimming pool is an outdoor amenity on the podium.",
        "what_it_changes": "Worth confirming seasonal usability with the builder.",
        "flip_condition": "The builder confirms the pool is located inside the enclosed clubhouse.",
        "assumptions_used": []
    }
    res = validate_finding(finding_pool_restatement, sample_pricing_packet)
    assert res.is_valid is False
    assert any("restates a brochure field, location, or boolean attribute" in err for err in res.errors)


def test_validator_reject_quantity_and_size_words(sample_pricing_packet):
    """3e. Reject quantity/size words: substantial, disproportionately, relatively, significantly, major."""
    finding_quantity = {
        "claim": "The unit carpet rate is ₹12,486 per sq ft.",
        "why_it_follows": "At ₹11,200,000 for 897 carpet sq ft, this represents a substantial difference.",
        "what_it_changes": "Worth confirming with the developer.",
        "flip_condition": "The builder confirms a significantly lower rate via addendum.",
        "assumptions_used": []
    }
    res = validate_finding(finding_quantity, sample_pricing_packet)
    assert res.is_valid is False
    assert any("subjective quantity/size word" in err for err in res.errors)


def test_validator_reject_unsupported_consequences_in_what_it_changes(sample_pricing_packet):
    """3f. Reject speculative leaps (loan eligibility, valuation, negotiation leverage, wiring)."""
    finding_speculation = {
        "claim": "The unit carpet rate is ₹12,486 per sq ft.",
        "why_it_follows": "At ₹11,200,000 for 897 carpet sq ft, rate is ₹12,486 per sq ft.",
        "what_it_changes": "This price discrepancy could affect loan eligibility or negotiation leverage.",
        "flip_condition": "The builder confirms a revised price schedule.",
        "assumptions_used": []
    }
    res = validate_finding(finding_speculation, sample_pricing_packet)
    assert res.is_valid is False
    assert any("unsupported speculative consequence" in err for err in res.errors)


def test_validator_reject_coincidental_comparisons(sample_pricing_packet):
    """3g. Reject coincidental comparisons (e.g. ISB matching DLF Cyber City)."""
    finding_coincidence = {
        "claim": "Annual commute hours to ISB are 183.3 hours, matching the DLF Cyber City figure.",
        "why_it_follows": "At 25 minutes across 220 days, ISB equals 183.3 hours matching DLF Cyber City.",
        "what_it_changes": "Worth confirming with transit schedules.",
        "flip_condition": "The road widening project reduces transit time to ISB.",
        "assumptions_used": []
    }
    res = validate_finding(finding_coincidence, sample_pricing_packet)
    assert res.is_valid is False
    assert any("coincidental comparison" in err for err in res.errors)


def test_validator_reject_generic_flip_condition(sample_pricing_packet):
    """3h. Reject generic flip condition ('the assumption differs' / 'actual schedule differs')."""
    finding_generic_flip = {
        "claim": "The unit carpet rate is ₹12,486 per sq ft.",
        "why_it_follows": "At ₹11,200,000 for 897 carpet sq ft, rate is ₹12,486 per sq ft.",
        "what_it_changes": "Worth confirming with the developer.",
        "flip_condition": "This flips if the buyer's actual working days differ from the 250-day assumption.",
        "assumptions_used": []
    }
    res = validate_finding(finding_generic_flip, sample_pricing_packet)
    assert res.is_valid is False
    assert any("generic assumption divergence" in err for err in res.errors)


def test_golden_bad_findings_rejected(sample_pricing_packet):
    """
    4. Evaluator & Validator Golden Bad Test:
    Loads golden_bad_findings.json containing the 8 flawed findings from the review table.
    Requires the validator/evaluator to reject at least 7 of 8.
    """
    import os
    import json
    golden_path = os.path.join(os.path.dirname(__file__), "golden_bad_findings.json")
    with open(golden_path, "r", encoding="utf-8") as f:
        bad_findings = json.load(f)

    rejected_count = 0
    total = len(bad_findings)
    assert total == 8

    for item in bad_findings:
        f = item["finding"]
        val_res = validate_finding(f, sample_pricing_packet)
        if not val_res.is_valid:
            rejected_count += 1
        else:
            print(f"FAILED TO REJECT: {item['id']} -> {f['claim']}")

    # Must reject at least 7 of 8 (target requirement: >= 7/8)
    assert rejected_count >= 7, f"Expected at least 7 rejected, but only {rejected_count} of {total} were rejected."
    # In our implementation, all 8 are rejected:
    assert rejected_count == 8, f"All 8 flawed findings must be rejected; got {rejected_count}/8"

