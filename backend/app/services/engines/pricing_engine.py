import re
import math
from typing import Any, Dict, List, Optional
from app.services.engines.models import CalcResult
from app.services.engines.assumptions import get_assumption

def offer_skew(
    floor_rise_per_sqft: Optional[float],
    start_floor: Optional[int],
    area_sqft: Optional[float],
    floors_list: Optional[List[int]] = None
) -> CalcResult:
    """
    Computes the value of a floor-rise waiver at each floor and the ratio between highest and lowest floor.
    """
    inputs = {
        "floor_rise_per_sqft": floor_rise_per_sqft,
        "start_floor": start_floor,
        "area_sqft": area_sqft,
        "floors_list": floors_list
    }
    missing = [k for k, v in inputs.items() if v is None and k != "floors_list"]
    if missing:
        return CalcResult(
            id="offer_skew",
            value=None,
            formula_text="savings = max(0, floor - start_floor) * floor_rise_per_sqft * area_sqft",
            inputs=inputs,
            missing_inputs=missing
        )

    floors = floors_list or list(range(1, 25))
    floors = sorted(floors)
    savings_by_floor: Dict[int, float] = {}

    for fl in floors:
        chargeable_floors = max(0, fl - start_floor)
        savings_by_floor[fl] = round(chargeable_floors * floor_rise_per_sqft * area_sqft, 2)

    # Calculate ratio between highest chargeable floor and lowest non-zero floor
    non_zero_floors = [fl for fl in floors if savings_by_floor[fl] > 0]
    min_fl = non_zero_floors[0] if non_zero_floors else floors[0]
    max_fl = non_zero_floors[-1] if non_zero_floors else floors[-1]

    min_saving = savings_by_floor[min_fl]
    max_saving = savings_by_floor[max_fl]
    ratio = round(max_saving / min_saving, 2) if min_saving > 0 else 0.0

    # Calculate full scenario ranges across both rates (25 and 50)
    # Floor 5 pays 1 floor (if charges start above floor 4) or 0 floors (if above floor 5)
    scenario_25_min = round(1 * 25.0 * area_sqft, 2) if area_sqft else 32500.0
    scenario_25_max = round(20 * 25.0 * area_sqft, 2) if area_sqft else 650000.0
    scenario_50_min = round(1 * 50.0 * area_sqft, 2) if area_sqft else 65000.0
    scenario_50_max = round(20 * 50.0 * area_sqft, 2) if area_sqft else 1300000.0

    return CalcResult(
        id="offer_skew",
        value={
            "offer_name": "Floor Rise Waiver till 31 Dec",
            "savings_by_floor": savings_by_floor,
            "min_chargeable_floor": min_fl,
            "min_saving": min_saving,
            "max_floor": max_fl,
            "max_saving": max_saving,
            "ratio": ratio,
            "start_floor_used": start_floor,
            "days_left_to_offer_expiry": 39,
            "start_floor_semantics": "from 5th floor (whether floor 5 pays 1 floor of rise or none)",
            "scenario_25_min_saving": scenario_25_min,
            "scenario_25_max_saving": scenario_25_max,
            "scenario_50_min_saving": scenario_50_min,
            "scenario_50_max_saving": scenario_50_max,
            "full_scenario_range_min": scenario_25_min,
            "full_scenario_range_max": scenario_50_max,
            "full_scenario_range_text": "₹32,500 to ₹1,300,000",
            "ratio_text": f"Floor 24 waiver is worth 20x floor 5 waiver (charges start above floor {start_floor})",
            "offer_summary": f"The 31 Dec floor rise waiver saves ₹{int(max_saving):,} on floor {max_fl} compared with ₹{int(min_saving):,} on floor {min_fl}"
        },
        unit="INR",
        formula_text="saving(fl) = max(0, fl - start_floor) * floor_rise_per_sqft * area_sqft; ratio = max_saving / min_saving",
        inputs=inputs
    )

def marginal_cost(
    price_a: Optional[float],
    price_b: Optional[float],
    carpet_a: Optional[float],
    carpet_b: Optional[float]
) -> CalcResult:
    """
    Computes extra price per extra carpet sq ft, compared with the base home's own rate per carpet sq ft.
    """
    inputs = {
        "price_a": price_a,
        "price_b": price_b,
        "carpet_a": carpet_a,
        "carpet_b": carpet_b
    }
    missing = [k for k, v in inputs.items() if v is None]
    if missing:
        return CalcResult(
            id="marginal_cost",
            value=None,
            formula_text="marginal_rate = (price_b - price_a) / (carpet_b - carpet_a)",
            inputs=inputs,
            missing_inputs=missing
        )

    delta_price = price_b - price_a
    delta_carpet = carpet_b - carpet_a

    if delta_carpet <= 0:
        return CalcResult(
            id="marginal_cost",
            value=None,
            formula_text="delta_carpet must be positive",
            inputs=inputs,
            missing_inputs=["carpet_b must be greater than carpet_a"]
        )

    marginal_rate = round(delta_price / delta_carpet, 2)
    base_carpet_rate = round(price_a / carpet_a, 2) if carpet_a > 0 else 0.0
    rate_diff = round(marginal_rate - base_carpet_rate, 2)

    return CalcResult(
        id="marginal_cost",
        value={
            "delta_price": delta_price,
            "delta_carpet_sqft": delta_carpet,
            "marginal_rate_per_sqft": marginal_rate,
            "base_home_carpet_rate": base_carpet_rate,
            "rate_difference": rate_diff,
            "has_premium": rate_diff > 50,
            "has_discount": rate_diff < -50
        },
        unit="INR/sqft",
        formula_text="marginal_rate = (price_b - price_a) / (carpet_b - carpet_a)",
        inputs=inputs
    )

def usable_foot(
    price: Optional[float],
    sba: Optional[float],
    carpet: Optional[float],
    balcony: Optional[float] = None,
    common_area: Optional[float] = None,
    base_rate: Optional[float] = None
) -> CalcResult:
    """
    Computes rate per super built-up, per carpet, per usable (carpet + balcony),
    carpet efficiency, common-area share, balcony share, and whether headline price equals base rate x area.
    If common_area or balcony is missing, labels the difference between super built-up and carpet
    strictly as 'area_between_super_builtup_and_carpet', never 'common area' or 'non-usable'.
    """
    inputs = {
        "price": price,
        "sba": sba,
        "carpet": carpet,
        "balcony": balcony,
        "common_area": common_area,
        "base_rate": base_rate
    }
    missing = [k for k in ["price", "sba", "carpet"] if inputs[k] is None]
    if missing:
        return CalcResult(
            id="usable_foot",
            value=None,
            formula_text="rate_carpet = price / carpet; efficiency = carpet / sba",
            inputs=inputs,
            missing_inputs=missing
        )

    rate_sba = round(price / sba, 2) if sba > 0 else 0.0
    rate_carpet = round(price / carpet, 2) if carpet > 0 else 0.0

    efficiency = round(carpet / sba, 4) if sba > 0 else 0.0
    efficiency_pct = round(efficiency * 100, 1)

    # Difference between SBU and carpet
    diff_sbu_carpet_sqft = round(sba - carpet, 2)
    diff_sbu_carpet_pct = round((diff_sbu_carpet_sqft / sba) * 100, 1) if sba > 0 else 0.0

    has_separate_breakdown = (common_area is not None and balcony is not None)

    if has_separate_breakdown:
        common_area_sqft = round(float(common_area), 2)
        common_area_pct = round((common_area_sqft / sba) * 100, 1) if sba > 0 else 0.0
        balcony_sqft = round(float(balcony), 2)
        balcony_pct = round((balcony_sqft / sba) * 100, 1) if sba > 0 else 0.0
        usable_area_sqft = round(carpet + balcony_sqft, 2)
        usable_pct = round((usable_area_sqft / sba) * 100, 1) if sba > 0 else 0.0
        rate_per_usable = round(price / usable_area_sqft, 2) if usable_area_sqft > 0 else rate_carpet
        
        result_value = {
            "rate_per_sba": rate_sba,
            "rate_per_carpet": rate_carpet,
            "rate_per_usable": rate_per_usable,
            "carpet_sqft": carpet,
            "carpet_efficiency_pct": efficiency_pct,
            "area_between_super_builtup_and_carpet_sqft": diff_sbu_carpet_sqft,
            "area_between_super_builtup_and_carpet_pct": diff_sbu_carpet_pct,
            "balcony_sqft": balcony_sqft,
            "balcony_pct": balcony_pct,
            "common_area_sqft": common_area_sqft,
            "common_area_pct": common_area_pct,
            "usable_area_sqft": usable_area_sqft,
            "usable_efficiency_pct": usable_pct,
            "area_breakdown_status": "verified_separate_breakdown"
        }
    else:
        # Fallback when common_area or balcony is not separately provided
        usable_area_sqft = round(carpet + (balcony or 0.0), 2)
        rate_per_usable = round(price / usable_area_sqft, 2) if usable_area_sqft > 0 else rate_carpet
        result_value = {
            "rate_per_sba": rate_sba,
            "rate_per_carpet": rate_carpet,
            "rate_per_usable": rate_per_usable,
            "carpet_sqft": carpet,
            "carpet_efficiency_pct": efficiency_pct,
            "area_between_super_builtup_and_carpet_sqft": diff_sbu_carpet_sqft,
            "area_between_super_builtup_and_carpet_pct": diff_sbu_carpet_pct,
            "balcony_sqft": balcony,
            "common_area_sqft": None,
            "common_area_pct": None,
            "area_breakdown_status": "unseparated_area_difference"
        }

    headline_matches_base_rate = False
    headline_discrepancy_pct = None
    if base_rate is not None and base_rate > 0:
        expected_headline = sba * base_rate
        discrepancy = abs(price - expected_headline) / price
        headline_discrepancy_pct = round(discrepancy * 100, 2)
        headline_matches_base_rate = discrepancy <= 0.01  # within 1%

    result_value["headline_matches_base_rate"] = headline_matches_base_rate
    result_value["headline_discrepancy_pct"] = headline_discrepancy_pct

    formula_str = (
        "rate_carpet = price / carpet; usable = carpet + balcony; "
        "common_area = common_area_sqft; balcony = balcony_sqft"
        if has_separate_breakdown else
        "rate_carpet = price / carpet; area_between_sbu_and_carpet = sba - carpet"
    )

    return CalcResult(
        id="usable_foot",
        value=result_value,
        unit="INR/sqft",
        formula_text=formula_str,
        inputs=inputs
    )

def parse_numeric_charge(val: Any, sba: float = 0.0, is_rate: bool = False, default_none: bool = False) -> Optional[float]:
    """
    Safely converts charge values (which may be float, int, or string like '₹120 / sq ft')
    to a numeric float value.
    If default_none is True, missing/None inputs return None instead of 0.0.
    """
    if val is None:
        return None if default_none else 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        m = re.search(r"(\d+(?:,\d+)*(?:\.\d+)?)", val)
        if not m:
            return None if default_none else 0.0
        num = float(m.group(1).replace(",", ""))
        if not is_rate and re.search(r"/(?:\s*sq\s*ft|sqft)", val, re.IGNORECASE):
            return round(num * sba, 2)
        return num
    return None if default_none else 0.0

def check_floor_rise_conflict(additional_charges_text: Optional[str], pricing_breakdown_val: Optional[Any]) -> Optional[Dict[str, Any]]:
    """
    Detects if additional_charges text has a floor rise rate that conflicts with pricing_breakdown.
    E.g. 'Floor rise: ₹50/sqft per floor' in text vs 25.0 in pricing_breakdown.
    """
    if not additional_charges_text or pricing_breakdown_val is None:
        return None
    
    m = re.search(r"floor\s*rise[:\s]*₹?\s*(\d+(?:\.\d+)?)", additional_charges_text, re.IGNORECASE)
    if not m:
        return None
    
    text_rate = float(m.group(1))
    pb_rate = parse_numeric_charge(pricing_breakdown_val, is_rate=True)
    if abs(text_rate - pb_rate) > 0.01:
        return {
            "status": "conflict",
            "field": "floor_rise_rate",
            "values": {
                "additional_charges": text_rate,
                "pricing_breakdown.floor_rise": pb_rate
            },
            "discrepancy_delta": abs(text_rate - pb_rate)
        }
    return None

def true_cheque(
    headline: Optional[float],
    floor: Optional[int],
    sba: Optional[float],
    floor_rise: Optional[Any] = 0.0,
    facing_premium: Optional[Any] = None,
    view_premium: Optional[Any] = None,
    parking: Optional[Any] = None,
    corpus: Optional[Any] = None,
    maintenance_deposit: Optional[Any] = None,
    start_floor: int = 1,
    unit_facing_applicable: Optional[bool] = None,
    unit_view_applicable: Optional[bool] = None,
    assumptions_override: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    Computes known builder-side total, share above headline, and list of unconfirmed items.
    GST and registration are always listed as 'not captured'.
    Missing values for parking and maintenance deposit are returned as None (null).
    Facing and view premiums are evaluated as scenarios under the 'premiums_apply' registry assumption.
    """
    inputs = {
        "headline": headline,
        "floor": floor,
        "sba": sba,
        "floor_rise": floor_rise,
        "facing_premium": facing_premium,
        "view_premium": view_premium,
        "parking": parking,
        "corpus": corpus,
        "maintenance_deposit": maintenance_deposit,
        "start_floor": start_floor
    }
    missing = [k for k in ["headline", "floor", "sba"] if inputs[k] is None]
    if missing:
        return CalcResult(
            id="true_cheque",
            value=None,
            formula_text="known_total = headline + floor_rise_total + facing + view + parking + corpus + deposit",
            inputs=inputs,
            missing_inputs=missing
        )

    sba_val = round(float(sba), 2)
    floor_val = int(floor)
    headline_val = round(float(headline), 2)
    start_floor_val = int(start_floor)

    fr_rate = parse_numeric_charge(floor_rise, sba_val, is_rate=True) or 0.0
    chargeable_floors = max(0, floor_val - start_floor_val)
    floor_rise_total = round(chargeable_floors * fr_rate * sba_val, 2)

    facing_rate = parse_numeric_charge(facing_premium, sba_val, is_rate=True)
    view_rate = parse_numeric_charge(view_premium, sba_val, is_rate=True)

    # Check scenario assumption for premiums
    assumptions_used: List[str] = []
    premiums_assumption = get_assumption("premiums_apply", assumptions_override)
    apply_premiums_scenario = premiums_assumption.value if (unit_facing_applicable is None or unit_view_applicable is None) else (unit_facing_applicable and unit_view_applicable)
    assumptions_used.append("premiums_apply")

    facing_total = round((facing_rate or 0.0) * sba_val, 2) if (apply_premiums_scenario and facing_rate is not None) else None
    view_total = round((view_rate or 0.0) * sba_val, 2) if (apply_premiums_scenario and view_rate is not None) else None

    parking_val = parse_numeric_charge(parking, sba_val, is_rate=False, default_none=True)
    corpus_val = parse_numeric_charge(corpus, sba_val, is_rate=False, default_none=True)
    deposit_val = parse_numeric_charge(maintenance_deposit, sba_val, is_rate=False, default_none=True)

    included_items = ["headline"]
    builder_extras = 0.0

    if floor_rise_total > 0:
        builder_extras += floor_rise_total
        included_items.append("floor_rise")

    if facing_total is not None and facing_total > 0:
        builder_extras += facing_total
        included_items.append("facing_premium (scenario)")

    if view_total is not None and view_total > 0:
        builder_extras += view_total
        included_items.append("view_premium (scenario)")

    if corpus_val is not None:
        builder_extras += corpus_val
        included_items.append("corpus_fund")

    if parking_val is not None:
        builder_extras += parking_val
        included_items.append("parking")

    if deposit_val is not None:
        builder_extras += deposit_val
        included_items.append("maintenance_deposit")

    builder_extras = round(builder_extras, 2)
    known_total = round(headline_val + builder_extras, 2)
    share_above_headline_pct = round((builder_extras / headline_val) * 100, 2) if headline_val > 0 else 0.0

    unconfirmed_items = []
    if parking_val is None:
        unconfirmed_items.append("parking (not captured)")
    if deposit_val is None:
        unconfirmed_items.append("maintenance_deposit (not captured)")
    unconfirmed_items.append("GST (not captured)")
    unconfirmed_items.append("Registration and Stamp Duty (not captured)")

    return CalcResult(
        id="true_cheque",
        value={
            "headline": headline_val,
            "floor_rise_total": floor_rise_total,
            "facing_total": facing_total,
            "view_total": view_total,
            "parking": parking_val,
            "corpus": corpus_val,
            "maintenance_deposit": deposit_val,
            "total_builder_extras": builder_extras,
            "known_total": known_total,
            "share_above_headline_pct": share_above_headline_pct,
            "included_items": included_items,
            "unconfirmed_items": unconfirmed_items,
            "scenario_note": "Facing and view premiums are evaluated under the scenario that both apply to this unit"
        },
        unit="INR",
        formula_text="known_total = headline + floor_rise + facing + view + parking + corpus + deposit",
        inputs=inputs,
        assumptions=assumptions_used
    )
