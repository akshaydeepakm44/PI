import math
from typing import Any, Dict, List, Optional
from app.services.engines.models import CalcResult
from app.services.engines.assumptions import get_assumption

def density_per_floor(
    blocks: Optional[List[Dict[str, Any]]],
    declared_units_per_floor: Optional[int] = 10
) -> CalcResult:
    """
    Computes homes per floor per tower vs declared units_per_floor,
    homes per passenger lift, and identifies odd-one-out towers.
    """
    inputs = {
        "blocks": blocks,
        "declared_units_per_floor": declared_units_per_floor
    }
    if not blocks:
        return CalcResult(
            id="density_per_floor",
            value=None,
            formula_text="homes_per_floor = units_count / floors",
            inputs=inputs,
            missing_inputs=["blocks"]
        )

    towers_analysis = []
    odd_one_out = []

    for b in blocks:
        name = b.get("name") or b.get("tower_number") or f"Tower {b.get('id', '')}"
        floors = b.get("floors", 0)
        units = b.get("units_count") or b.get("total_units") or 0
        lifts = b.get("passenger_lifts", 3)

        homes_per_floor = round(units / floors, 2) if floors > 0 else 0.0
        homes_per_lift = round(units / lifts, 2) if lifts > 0 else 0.0

        diff_from_declared = round(homes_per_floor - (declared_units_per_floor or 10), 2)

        t_data = {
            "name": name,
            "floors": floors,
            "total_units": units,
            "passenger_lifts": lifts,
            "homes_per_floor": homes_per_floor,
            "homes_per_lift": homes_per_lift,
            "diff_from_declared": diff_from_declared
        }
        towers_analysis.append(t_data)

        # Odd one out: differs from declared by > 1.0 unit/floor or highest density
        if abs(diff_from_declared) >= 1.0:
            odd_one_out.append(name)

    total_lifts_sum = sum(b.get("passenger_lifts", 3) for b in blocks)
    total_units_sum = sum(b.get("units_count") or b.get("total_units") or 0 for b in blocks)
    total_floors_sum = sum(b.get("floors", 0) for b in blocks)

    total_homes_per_lift = round(total_units_sum / total_lifts_sum, 2) if total_lifts_sum > 0 else 0.0
    avg_units_per_floor = round(total_units_sum / total_floors_sum, 2) if total_floors_sum > 0 else 0.0

    return CalcResult(
        id="density_per_floor",
        value={
            "towers": towers_analysis,
            "total_passenger_lifts": total_lifts_sum,
            "total_homes_per_lift": total_homes_per_lift,
            "units_per_floor": avg_units_per_floor,
            "average_units_per_floor": avg_units_per_floor,
            "declared_units_per_floor": declared_units_per_floor,
            "odd_one_out_towers": odd_one_out,
            "summary_text": f"Towers {', '.join(odd_one_out)} carry higher floor density than declared" if odd_one_out else "Tower densities align with declared units per floor"
        },
        unit="units/floor",
        formula_text="homes_per_floor = units_count / floors; homes_per_lift = units_count / passenger_lifts",
        inputs=inputs
    )

def consistency(
    blocks: Optional[List[Dict[str, Any]]],
    declared_total_units: Optional[int],
    uds_per_unit: Optional[float] = None,
    acreage: Optional[float] = None
) -> CalcResult:
    """
    Checks sum of tower totals vs declared total vs floors x units_per_floor;
    undivided-land-share total vs site area.
    """
    inputs = {
        "blocks": blocks,
        "declared_total_units": declared_total_units,
        "uds_per_unit": uds_per_unit,
        "acreage": acreage
    }
    missing = []
    if blocks is None:
        missing.append("blocks")
    if declared_total_units is None:
        missing.append("declared_total_units")
    if missing:
        return CalcResult(
            id="consistency",
            value=None,
            formula_text="sum(tower_units) vs declared_total vs sum(floors * declared_units_per_floor)",
            inputs=inputs,
            missing_inputs=missing
        )

    sum_tower_units = sum(b.get("units_count") or b.get("total_units") or 0 for b in blocks)
    sum_floors = sum(b.get("floors", 0) for b in blocks)

    # Guard: Counts of 0, NaN or negative must return missing inputs, never 0.0 values
    if sum_tower_units <= 0 or sum_floors <= 0:
        return CalcResult(
            id="consistency",
            value=None,
            formula_text="sum(tower_units) vs declared_total vs sum(floors * declared_units_per_floor)",
            inputs=inputs,
            missing_inputs=["valid_tower_units_or_floors"]
        )

    avg_computed_per_floor = round(sum_tower_units / sum_floors, 2)

    declared_upf = (blocks[0].get("declared_units_per_floor") or 10) if blocks else 10
    calc_floors_times_declared = sum(b.get("floors", 0) * (b.get("declared_units_per_floor") or declared_upf) for b in blocks)

    gap_vs_floors = sum_tower_units - calc_floors_times_declared
    gap_vs_declared = sum_tower_units - declared_total_units

    semantic_uncertain = False
    assumed_semantic = "total_units_per_floor_plate"
    semantic_note = None

    if declared_upf > 0 and (avg_computed_per_floor / declared_upf > 1.5 or avg_computed_per_floor / declared_upf < 0.6):
        semantic_uncertain = True
        assumed_semantic = "units_per_core_or_wing"
        semantic_note = (
            f"Declared units_per_floor ({declared_upf}) differs from computed ({avg_computed_per_floor}/floor). "
            f"Assumed semantic: '{assumed_semantic}'; builder needs to clarify."
        )

    uds_check = None
    if uds_per_unit and acreage:
        total_uds_sqft = declared_total_units * uds_per_unit
        site_sqft = acreage * 43560.0
        uds_check = {
            "total_uds_sqft": total_uds_sqft,
            "site_sqft": site_sqft,
            "discrepancy_sqft": round(total_uds_sqft - site_sqft, 2),
            "matches_site_area": abs(total_uds_sqft - site_sqft) < 500
        }

    return CalcResult(
        id="consistency",
        value={
            "sum_tower_units": sum_tower_units,
            "declared_total_units": declared_total_units,
            "floors_times_declared_units": calc_floors_times_declared,
            "gap_floors_vs_tower_units": gap_vs_floors,
            "gap_declared_vs_sum": gap_vs_declared,
            "is_internally_consistent": (gap_vs_floors == 0 and gap_vs_declared == 0) if not semantic_uncertain else None,
            "semantic_uncertain": semantic_uncertain,
            "assumed_semantic": assumed_semantic,
            "semantic_note": semantic_note,
            "uds_check": uds_check
        },
        unit="units",
        formula_text="gap = sum(tower_units) - sum(floors * units_per_floor)",
        inputs=inputs
    )

def basement_footprint(
    unit_count: Optional[int],
    site_sqm: Optional[float] = None,
    site_acres: Optional[float] = None,
    cars_per_home: Optional[float] = None,
    sqm_per_slot: Optional[float] = None,
    assumptions_override: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    Computes required basement area and share of site per level.
    Uses assumptions 'cars_per_home' (1) and 'sqm_per_parking_slot' (30).
    """
    inputs = {
        "unit_count": unit_count,
        "site_sqm": site_sqm,
        "site_acres": site_acres,
        "cars_per_home": cars_per_home,
        "sqm_per_slot": sqm_per_slot
    }
    if unit_count is None:
        return CalcResult(
            id="basement_footprint",
            value=None,
            formula_text="parking_sqm = unit_count * cars_per_home * sqm_per_slot",
            inputs=inputs,
            missing_inputs=["unit_count"]
        )

    # Resolve site area in sqm
    resolved_site_sqm = site_sqm
    resolved_site_acres = site_acres
    if resolved_site_sqm is None and resolved_site_acres is not None:
        resolved_site_sqm = round(resolved_site_acres * 4046.85642, 2)
    elif resolved_site_acres is None and resolved_site_sqm is not None:
        resolved_site_acres = round(resolved_site_sqm / 4046.85642, 2)

    if resolved_site_sqm is None or resolved_site_sqm <= 0:
        return CalcResult(
            id="basement_footprint",
            value=None,
            formula_text="parking_sqm = unit_count * cars_per_home * sqm_per_slot",
            inputs=inputs,
            missing_inputs=["site_sqm or site_acres"]
        )

    # Plausibility checks on input density
    homes_per_acre = round(unit_count / resolved_site_acres, 1) if (resolved_site_acres and resolved_site_acres > 0) else 0.0

    assumptions_used = []
    
    # Resolve cars_per_home
    resolved_cars = cars_per_home
    if resolved_cars is None:
        c_assump = get_assumption("cars_per_home", assumptions_override)
        resolved_cars = c_assump.value
        assumptions_used.append("cars_per_home")
    else:
        assumptions_used.append("cars_per_home")

    # Resolve sqm_per_slot
    resolved_sqm_slot = sqm_per_slot
    if resolved_sqm_slot is None:
        s_assump = get_assumption("sqm_per_parking_slot", assumptions_override)
        resolved_sqm_slot = s_assump.value
        assumptions_used.append("sqm_per_parking_slot")
    else:
        assumptions_used.append("sqm_per_parking_slot")

    required_parking_sqm = round(unit_count * resolved_cars * resolved_sqm_slot, 2)
    share_of_site = round(required_parking_sqm / resolved_site_sqm, 4)
    share_pct = round(share_of_site * 100, 1)

    # Plausibility guards:
    # If share of site per level > 400%, or homes per acre is outside 5-300:
    # return status "implausible_input" with missing_inputs naming "site_acres"
    if share_pct > 400.0 or homes_per_acre < 5.0 or homes_per_acre > 300.0:
        return CalcResult(
            id="basement_footprint",
            value=None,
            unit="sq m",
            formula_text="parking_sqm = unit_count * cars_per_home * sqm_per_slot; share = parking_sqm / site_sqm",
            inputs=inputs,
            assumptions=assumptions_used,
            missing_inputs=["site_acres"],
            status="implausible_input"
        )

    return CalcResult(
        id="basement_footprint",
        value={
            "required_parking_sqm": required_parking_sqm,
            "site_sqm": resolved_site_sqm,
            "share_of_site_pct": share_pct,
            "cars_per_home": resolved_cars,
            "sqm_per_slot": resolved_sqm_slot,
            "homes_per_acre": homes_per_acre,
            "summary_text": f"About {int(required_parking_sqm):,} sq m, {int(share_pct)}% of site per level"
        },
        unit="sq m",
        formula_text="parking_sqm = unit_count * cars_per_home * sqm_per_slot; share = parking_sqm / site_sqm",
        inputs=inputs,
        assumptions=assumptions_used,
        status="ok"
    )

def straight_line_distances(
    tower_entrances: Optional[Dict[str, Dict[str, float]]],
    clubhouse_xy: Optional[Dict[str, float]],
    green_xy: Optional[Dict[str, float]] = None
) -> CalcResult:
    """
    Computes per tower Euclidean straight-line distance to clubhouse,
    farthest vs nearest ratio.
    """
    inputs = {
        "tower_entrances": tower_entrances,
        "clubhouse_xy": clubhouse_xy,
        "green_xy": green_xy
    }
    missing = []
    if not tower_entrances:
        missing.append("tower_entrances")
    if not clubhouse_xy:
        missing.append("clubhouse_xy")
    if missing:
        return CalcResult(
            id="straight_line_distances",
            value=None,
            formula_text="dist = sqrt((x2-x1)^2 + (y2-y1)^2)",
            inputs=inputs,
            missing_inputs=missing
        )

    cx, cy = clubhouse_xy.get("x", 0.0), clubhouse_xy.get("y", 0.0)
    distances = {}

    for t_name, coords in tower_entrances.items():
        tx, ty = coords.get("x", 0.0), coords.get("y", 0.0)
        d = round(math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2), 2)
        distances[t_name] = d

    sorted_dists = sorted(distances.items(), key=lambda x: x[1])
    nearest_tower, min_dist = sorted_dists[0]
    farthest_tower, max_dist = sorted_dists[-1]
    ratio = round(max_dist / min_dist, 2) if min_dist > 0 else 1.0

    return CalcResult(
        id="straight_line_distances",
        value={
            "distances": distances,
            "nearest_tower": nearest_tower,
            "nearest_distance_m": min_dist,
            "farthest_tower": farthest_tower,
            "farthest_distance_m": max_dist,
            "ratio": ratio,
            "ratio_text": f"Farthest tower ({farthest_tower}) is about {ratio}x as far as nearest ({nearest_tower})"
        },
        unit="meters",
        formula_text="dist = sqrt((tx - cx)^2 + (ty - cy)^2); ratio = max_dist / min_dist",
        inputs=inputs
    )

def solar_shadow(
    lat: Optional[float],
    height_m: Optional[float],
    solar_altitude_deg: Optional[float] = 15.5
) -> CalcResult:
    """
    Shadow length = height / tan(altitude)
    """
    inputs = {
        "lat": lat,
        "height_m": height_m,
        "solar_altitude_deg": solar_altitude_deg
    }
    if height_m is None or solar_altitude_deg is None:
        return CalcResult(
            id="solar_shadow",
            value=None,
            formula_text="shadow_length = height_m / tan(radians(altitude_deg))",
            inputs=inputs,
            missing_inputs=[k for k, v in inputs.items() if v is None]
        )

    rad = math.radians(solar_altitude_deg)
    shadow_len = round(height_m / math.tan(rad), 2) if math.tan(rad) > 0 else 0.0

    return CalcResult(
        id="solar_shadow",
        value={
            "height_m": height_m,
            "solar_altitude_deg": solar_altitude_deg,
            "shadow_length_m": shadow_len
        },
        unit="meters",
        formula_text="shadow_len = height_m / tan(radians(altitude_deg))",
        inputs=inputs
    )
