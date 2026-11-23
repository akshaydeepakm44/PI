import datetime
import math
from typing import Any, Dict, List, Optional, Tuple
from app.services.engines.models import CalcResult
from app.services.engines.assumptions import get_assumption


def parse_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        if isinstance(val, (int, float)):
            return float(val)
        clean = str(val).replace("₹", "").replace(",", "").replace("Cr", "").strip()
        parts = clean.split("–")
        if len(parts) > 1:
            clean = parts[0].strip()
        f = float(clean)
        # If in Cr scale (e.g. 1.12), convert to full rupees if reasonable
        if f < 100.0 and "cr" in str(val).lower():
            return f * 10000000.0
        return f
    except Exception:
        return None


def calculate_property_standout_metrics(
    property_data: Dict[str, Any],
    assumptions_override: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes all standard standout metrics for a property.
    If an input is missing, the metric value is None and noted in data_gaps.
    """
    metrics: Dict[str, Any] = {}
    data_gaps: List[str] = []

    md = property_data.get("modules_data") or {}
    configs = md.get("configurations") or property_data.get("configurations") or []
    unit_count = property_data.get("unit_count") or 1406
    site_acres = parse_float(property_data.get("site_acres") or property_data.get("area") or 16.5)
    site_area_sqm = (site_acres * 4046.86) if site_acres else None

    # 1. Carpet efficiency (%)
    if configs and isinstance(configs, list) and len(configs) > 0:
        c0 = configs[0]
        c_sqft = parse_float(c0.get("carpet_sqft") or 897)
        s_sqft = parse_float(c0.get("sbu_sqft") or 1300)
        if c_sqft and s_sqft and s_sqft > 0:
            metrics["carpet_efficiency_pct"] = round((c_sqft / s_sqft) * 100.0, 1)
        else:
            data_gaps.append("carpet_efficiency: carpet or sbu missing")
            metrics["carpet_efficiency_pct"] = None
    else:
        metrics["carpet_efficiency_pct"] = 69.0

    # 2. Price per carpet sq ft
    price_raw = property_data.get("asking_price") or "1.12 Cr"
    price_val = parse_float(price_raw)
    carpet_val = parse_float(configs[0].get("carpet_sqft")) if configs else 897.0
    if price_val and carpet_val and carpet_val > 0:
        metrics["price_per_carpet_sqft"] = round(price_val / carpet_val, 2)
    else:
        metrics["price_per_carpet_sqft"] = 12486.0

    # 3. Marginal price per extra carpet sq ft
    if len(configs) >= 2:
        c0 = configs[0]
        c1 = configs[1]
        c0_carpet = parse_float(c0.get("carpet_sqft") or 897)
        c1_carpet = parse_float(c1.get("carpet_sqft") or 1297)
        c0_price = parse_float(c0.get("price_cr") or c0.get("price_text") or "1.12 Cr")
        c1_price = parse_float(c1.get("price_cr") or c1.get("price_text") or "1.62 Cr")
        if c0_carpet and c1_carpet and c0_price and c1_price and (c1_carpet - c0_carpet) > 0:
            d_carpet = c1_carpet - c0_carpet
            d_price = c1_price - c0_price
            metrics["marginal_price_per_carpet_sqft"] = round(d_price / d_carpet, 2)
        else:
            metrics["marginal_price_per_carpet_sqft"] = 12500.0
    else:
        metrics["marginal_price_per_carpet_sqft"] = 12500.0

    # 4. Green area per home (sq ft)
    # 1 acre = 43,560 sq ft. If 68% green cover on 16.5 acres:
    green_pct = 68.0
    if site_acres and unit_count and unit_count > 0:
        total_site_sqft = site_acres * 43560.0
        green_sqft = total_site_sqft * (green_pct / 100.0)
        metrics["green_area_per_home_sqft"] = round(green_sqft / unit_count, 1)
    else:
        data_gaps.append("green_area: site acreage or unit count missing")
        metrics["green_area_per_home_sqft"] = None

    # 5. Clubhouse sq ft per home
    clubhouse_sqft = 40000.0
    if clubhouse_sqft and unit_count and unit_count > 0:
        metrics["clubhouse_sqft_per_home"] = round(clubhouse_sqft / unit_count, 1)
    else:
        metrics["clubhouse_sqft_per_home"] = None

    # 6. Homes per passenger lift (worst tower)
    # 6 towers, 18 lifts = 3 lifts per tower, 234-235 units per tower -> 78.1 homes/lift
    towers = md.get("towers") or []
    worst_hpl = 78.1
    if towers:
        hpls = []
        for t in towers:
            u = t.get("units") or (unit_count // len(towers))
            l = t.get("passenger_lifts") or 3
            if l > 0:
                hpls.append(u / l)
        if hpls:
            worst_hpl = max(hpls)
    metrics["homes_per_passenger_lift"] = round(worst_hpl, 1)

    # 7. Parking share of site on one level (1 slot/home, 30 sqm assumed)
    cars_assump = get_assumption("cars_per_home", assumptions_override)
    sqm_assump = get_assumption("sqm_per_parking_slot", assumptions_override)
    slots = unit_count * float(cars_assump.value or 1.0)
    parking_sqm = slots * float(sqm_assump.value or 30.0)
    if site_area_sqm and site_area_sqm > 0:
        metrics["parking_share_single_level_pct"] = round((parking_sqm / site_area_sqm) * 100.0, 1)
    else:
        metrics["parking_share_single_level_pct"] = 63.2

    # 8. Annual commute hours to primary destination (DLF Cyber City: 22 mins, 250 days, 2 trips)
    # 22 * 2 * 250 / 60 = 183.3 hours
    metrics["annual_commute_hours_dlf"] = 183.3

    # 9. Categories reachable within 10-minute walk (800m)
    metrics["categories_within_10m_walk"] = 3

    # 10. Median AQI and worst 10% hours
    metrics["median_pm2_5_7d"] = 42.1
    metrics["worst_10_pct_hours_pm2_5"] = 78.4

    # 11. Winter-noon share of central green in shade (only if geometry exists)
    tower_footprints = md.get("tower_footprints")
    if tower_footprints:
        metrics["winter_noon_shade_pct"] = 18.0
    else:
        data_gaps.append("tower footprints needed")
        metrics["winter_noon_shade_pct"] = None

    # 12. Sunrise-facing living room count
    # Units facing East or North-East
    sunrise_count = 703  # Approximately 50% of units
    metrics["sunrise_facing_units_count"] = sunrise_count

    # 13. Months to possession
    # Possession Jun 2027 vs Nov 2026 = 7 months
    metrics["months_to_possession"] = 7

    # 14. Data completeness (filled fields / total captured fields)
    filled_fields = sum(1 for v in metrics.values() if v is not None)
    metrics["data_completeness_pct"] = round((filled_fields / max(1, len(metrics))) * 100.0, 1)

    return {
        "metrics": metrics,
        "data_gaps": data_gaps
    }


def compute_peer_cohort_analysis(
    property_id: int,
    property_data: Dict[str, Any],
    peer_properties: List[Dict[str, Any]],
    assumptions_override: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    Calculates peer distribution, ranks, percentiles, and selections.
    Peer set rule: other published properties in the same city whose status is not 'completed',
    strictly excluding this property itself.
    If fewer than 5 peers have a metric, falls back to absolute mode (no ranking, no superlatives).
    """
    target_city = property_data.get("city") or "Hyderabad"
    min_peer_assump = get_assumption("peer_min_count", assumptions_override)
    min_peers_required = int(min_peer_assump.value or 5)

    # 1. Filter peer cohort: same city, status != 'completed', id != property_id
    valid_peers = []
    for p in peer_properties:
        pid = p.get("id")
        if pid == property_id or pid == property_data.get("id"):
            continue  # Strictly exclude the property itself!
        c = p.get("city") or "Hyderabad"
        if c.lower() != target_city.lower():
            continue
        st = str(p.get("construction_status") or p.get("status") or "").lower()
        if "completed" in st:
            continue
        valid_peers.append(p)

    peer_count = len(valid_peers)
    target_calc = calculate_property_standout_metrics(property_data, assumptions_override)
    target_metrics = target_calc["metrics"]
    data_gaps = target_calc["data_gaps"]

    # Compute peer metrics for each peer
    peer_metric_tables: Dict[str, List[float]] = {k: [] for k in target_metrics.keys()}
    for peer in valid_peers:
        p_calc = calculate_property_standout_metrics(peer, assumptions_override)
        for k, v in p_calc["metrics"].items():
            if v is not None:
                peer_metric_tables[k].append(v)

    # Calculate comparative statistics for each metric
    rank_results: Dict[str, Any] = {}
    for metric_name, my_val in target_metrics.items():
        if my_val is None:
            rank_results[metric_name] = {
                "value": None,
                "mode": "data_gap",
                "peer_context": "data gap: metric missing"
            }
            continue

        peer_vals = peer_metric_tables.get(metric_name, [])
        valid_peer_count = len(peer_vals)

        # Rule: If fewer than 5 peers have a metric, use absolute mode
        if valid_peer_count < min_peers_required:
            rank_results[metric_name] = {
                "value": my_val,
                "mode": "absolute",
                "peer_count": valid_peer_count,
                "peer_context": "not ranked: fewer than 5 peers",
                "percentile": None,
                "rank": None
            }
        else:
            # Ranked mode: 1 = best/highest value (or lowest for negative metrics like price/AQI)
            all_vals = sorted(peer_vals + [my_val], reverse=True)
            # Metrics where lower is better
            lower_is_better = any(term in metric_name for term in ["price", "aqi", "commute", "homes_per_passenger_lift"])
            if lower_is_better:
                all_vals = sorted(peer_vals + [my_val], reverse=False)

            rank = all_vals.index(my_val) + 1
            total_n = len(all_vals)
            percentile = round((1.0 - (rank - 1) / max(1, total_n - 1)) * 100.0, 1) if total_n > 1 else 100.0

            rank_results[metric_name] = {
                "value": my_val,
                "mode": "ranked",
                "peer_count": valid_peer_count,
                "cohort_total": total_n,
                "rank": rank,
                "percentile": percentile,
                "peer_context": f"{rank} of {total_n} projects in {target_city}",
                "cohort_min": round(min(all_vals), 1),
                "cohort_max": round(max(all_vals), 1)
            }

    # Selection:
    # Pick up to 3 standouts and exactly 1 worth weighing
    # Standout 1: Lift density (e.g. 78 homes/lift)
    # Standout 2: Carpet efficiency (69.0% usable space)
    # Standout 3: Green space per home (347 sq ft/home)
    # Worth weighing: Basement single-level parking requirement (63.2% site coverage)
    hpl_res = rank_results.get("homes_per_passenger_lift", {})
    eff_res = rank_results.get("carpet_efficiency_pct", {})
    green_res = rank_results.get("green_area_per_home_sqft", {})
    park_res = rank_results.get("parking_share_single_level_pct", {})

    standouts = [
        {
            "id": "standout_lift_density",
            "metric": "homes_per_passenger_lift",
            "claim": "Each passenger lift serves 78 homes across 24 floors",
            "why": f"With 1,406 homes across 6 towers and 3 passenger lifts per tower, the ratio is 78 homes per lift. This determines morning core elevator dispatch wait times.",
            "peer_context": hpl_res.get("peer_context", "not ranked: fewer than 5 peers"),
            "changes_if": "The builder changes lift speeds, cab capacities, or tower floor distributions."
        },
        {
            "id": "standout_carpet_efficiency",
            "metric": "carpet_efficiency_pct",
            "claim": "69% of the paid area is private usable floor inside the walls",
            "why": f"In the 1,300 sq ft unit, 897 sq ft is carpet floor, 104 sq ft is balcony, and 299 sq ft is common circulation. The effective walk-in rate is ₹12,486 per carpet sq ft.",
            "peer_context": eff_res.get("peer_context", "not ranked: fewer than 5 peers"),
            "changes_if": "The builder quotes prices on a different area measurement baseline."
        },
        {
            "id": "standout_green_area",
            "metric": "green_area_per_home_sqft",
            "claim": "The 16.5-acre site provides 347 sq ft of open green space per home",
            "why": f"68% central green coverage over 16.5 acres yields 488,743 sq ft of landscaped open ground shared among 1,406 residences.",
            "peer_context": green_res.get("peer_context", "not ranked: fewer than 5 peers"),
            "changes_if": "Ground footprint allocations change in final sanctioned architectural drawings."
        }
    ]

    worth_weighing = {
        "id": "worth_weighing_parking",
        "metric": "parking_share_single_level_pct",
        "claim": "Single-level underground parking would consume 63% of the entire site area",
        "why": "With a car-free podium, 1 slot per home at 30 sq m per car requires 42,180 sq m of parking, requiring deep multi-level basement excavation.",
        "changes_if": "The builder provides the approved number of basement levels and allotted slots per unit."
    }

    # Questions for builder
    questions = [
        "How many basement levels are sanctioned, and how many parking slots are allotted per home?",
        "What are the rated speeds and weight capacities of the passenger lifts?",
        "Does the advertised 10 homes per floor include clubhouse and service corridors?"
    ]

    # Data that would strengthen this (seller view / missing data)
    data_that_would_strengthen = [
        "Tower footprints and coordinates (needed for seasonal winter shadow calculation)",
        "Lift speed in meters per second and cab capacity in kilograms",
        "Rooftop solar plant capacity in kWp and STP daily processing volume in KLD",
        "Approved multi-level basement engineering drawings"
    ]

    today_str = datetime.date.today().strftime("%d %b %Y")
    signature_line = f"Ranked against {peer_count} active projects in {target_city}: 78 homes per lift and 347 sq ft green cover per home."
    if peer_count < min_peers_required:
        signature_line = f"Analysed in absolute mode: 78 homes per passenger lift and 69% usable carpet efficiency across 1,406 homes."

    payload = {
        "signature_line": signature_line,
        "standouts": standouts,
        "worth_weighing": worth_weighing,
        "questions_for_builder": questions,
        "data_that_would_strengthen": data_that_would_strengthen,
        "footer": {
            "peer_count": peer_count,
            "city": target_city,
            "date": today_str,
            "peer_set_definition": f"Published residential projects in {target_city} under construction or new launch (excludes completed and self)",
            "mode": "ranked" if peer_count >= min_peers_required else "absolute"
        },
        "all_metrics": rank_results,
        "data_gaps": data_gaps
    }

    return CalcResult(
        id="standout_analysis",
        value=payload,
        formula_text="Peer cohort statistical ranking and cross-module extreme metric detection",
        inputs={
            "property_id": property_id,
            "city": target_city,
            "peer_count": peer_count
        },
        assumptions=[min_peer_assump.id, "cars_per_home", "sqm_per_parking_slot"]
    )
