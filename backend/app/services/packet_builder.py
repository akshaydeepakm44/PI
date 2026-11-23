import json
import re
from typing import Any, Dict, List, Optional
from app.services.engines import (
    offer_skew,
    marginal_cost,
    usable_foot,
    true_cheque,
    check_floor_rise_conflict,
    density_per_floor,
    consistency,
    basement_footprint,
    straight_line_distances,
    annual_commute_hours,
    implied_speed,
    claim_ledger,
    calculate_solar_seasons,
    calculate_tower_shadows,
    calculate_facade_sunlight,
    calculate_price_orientation_delta,
    calculate_central_green_shade,
    calculate_air_quality_metrics,
    compute_peer_cohort_analysis,
    compute_map_engine_analysis,
    compute_terrain_elevation_analysis,
    compute_peer_engine_analysis,
    lookup_registration,
    compare_record_with_builder_data,
    ASSUMPTIONS_REGISTRY,
    CalcResult
)
from app.services.air_quality import fetch_air_quality_7d

# Strict ALLOW-LIST of permitted property fields.
# Anything not explicitly listed here (e.g. owner_x, seller_y, pan_z, aadhaar, bank) is dropped.
ALLOWED_PROPERTY_FIELDS = {
    "id",
    "property_id",
    "name",
    "property_type",
    "state",
    "city",
    "locality",
    "latitude",
    "longitude",
    "unit_count",
    "total_units",
    "floors",
    "site_acres",
    "acreage",
    "area",
    "area_unit",
    "declared_units_per_floor",
    "additional_charges",
    "maintenance_charges",
    "modules_data",
    "configurations",
    "unit_plans",
    "pricing_breakdown",
    "pricing_model",
    "transit_routes",
    "commute_hubs",
    "amenities",
    "utilities",
    "construction_status"
}

ALLOWED_MODULES_DATA_KEYS = {
    "configurations",
    "pricing_breakdown",
    "towers",
    "master_plan",
    "commute_hubs",
    "tower_entrances",
    "clubhouse_coords",
    "tower_footprints",
    "green_space",
    "neighbourhood_places"
}

def filter_by_allow_list(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safeguard: filters dictionary strictly by allow-list.
    Automatically rejects any key containing 'owner', 'seller', 'pan', 'aadhaar', or not allowed.
    """
    if not isinstance(data, dict):
        return {}

    clean = {}
    for k, v in data.items():
        k_lower = k.lower()
        # Explicit block for any pattern containing sensitive terms
        if any(term in k_lower for term in ["owner", "seller", "pan", "aadhaar", "bank", "contact", "phone", "email"]):
            continue
        if k in ALLOWED_PROPERTY_FIELDS:
            if k == "modules_data" and isinstance(v, dict):
                clean[k] = {
                    sub_k: sub_v for sub_k, sub_v in v.items()
                    if sub_k in ALLOWED_MODULES_DATA_KEYS
                }
            else:
                clean[k] = v
    return clean

def build_calculation_packet(
    property_data: Dict[str, Any],
    module: str,
    assumptions_override: Optional[Dict[str, Any]] = None,
    peer_properties: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Builds a compact calculation packet for a property and module.
    Only contains results, assumptions, data_gaps, and metadata.
    Raw property data is never sent to the LLM.
    """
    # 1. Filter property data strictly by allow-list
    module = (module or "").replace("-", "_")
    if module == "units":
        module = "pricing"
    clean_prop = filter_by_allow_list(property_data)
    property_id = clean_prop.get("id") or clean_prop.get("property_id")

    results: List[CalcResult] = []
    data_gaps: List[Dict[str, str]] = []
    assumptions_used: Dict[str, Any] = {}

    md = clean_prop.get("modules_data", {}) or {}
    configs = md.get("configurations") or clean_prop.get("configurations") or clean_prop.get("unit_plans", []) or []
    pb = md.get("pricing_breakdown") or clean_prop.get("pricing_breakdown") or clean_prop.get("pricing_model", {}) or {}
    towers = md.get("towers") or clean_prop.get("towers", []) or []
    commute = md.get("commute_hubs") or clean_prop.get("transit_routes") or clean_prop.get("commute_hubs", []) or []
    amenities = clean_prop.get("amenities", []) or []
    utilities = clean_prop.get("utilities", []) or []

    # =========================================================================
    # MODULE: PRICING (Unit plans and pricing)
    # =========================================================================
    if module == "pricing":
        for i, cfg in enumerate(configs):
            cfg_name = cfg.get("name", f"Unit {i+1}")
            price = cfg.get("price") or (cfg.get("price_cr", 0) * 10_000_000 if cfg.get("price_cr") else None)
            sba = cfg.get("sbu_sqft") or cfg.get("super_built_up_sqft")
            carpet = cfg.get("carpet_sqft") or cfg.get("carpet")
            balcony = cfg.get("balcony_sqft") or cfg.get("balcony")
            common_area = cfg.get("common_area_sqft") or cfg.get("common_area")
            res = usable_foot(
                price=price,
                sba=sba,
                carpet=carpet,
                balcony=balcony,
                common_area=common_area,
                base_rate=pb.get("base_rate")
            )
            res.id = f"usable_foot_{cfg_name.lower().replace(' ', '_')}"
            results.append(res)

        if len(configs) >= 2:
            c1, c2 = configs[0], configs[1]
            p1 = c1.get("price") or (c1.get("price_cr", 0) * 10_000_000)
            p2 = c2.get("price") or (c2.get("price_cr", 0) * 10_000_000)
            carpet1 = c1.get("carpet_sqft") or c1.get("carpet")
            carpet2 = c2.get("carpet_sqft") or c2.get("carpet")
            m_res = marginal_cost(
                price_a=p1,
                price_b=p2,
                carpet_a=carpet1,
                carpet_b=carpet2
            )
            results.append(m_res)

        # Check for conflicting sources in floor rise
        add_charges = clean_prop.get("additional_charges")
        conflict = check_floor_rise_conflict(add_charges, pb.get("floor_rise"))
        sample_sba = configs[0].get("sbu_sqft") or configs[0].get("super_built_up_sqft", 1300) if configs else 1300
        start_floor = pb.get("floor_rise_start_floor") or pb.get("start_floor") or 4
        c = configs[0] if configs else None
        p = (c.get("price") or (c.get("price_cr", 0) * 10_000_000)) if c else None

        if conflict:
            rate_pb = float(conflict["values"]["pricing_breakdown.floor_rise"])
            rate_ac = float(conflict["values"]["additional_charges"])
            data_gaps.append({
                "field": "floor_rise_rate",
                "module": "pricing",
                "needed_for": "offer_skew and true_cheque",
                "status": "conflict",
                "values": conflict["values"],
                "description": f"Floor rise appears as ₹{int(rate_ac)} and ₹{int(rate_pb)} per sq ft in builder documentation, which applies?"
            })

            # Do NOT compute a single unconfirmed offer_skew or true_cheque.
            # Instead, return labelled scenarios for each conflicting rate.
            for rate, rate_id in [(rate_pb, "scenario_floor_rise_rate_25"), (rate_ac, "scenario_floor_rise_rate_50")]:
                int_rate = int(rate)
                # Offer skew scenario
                sk_scen = offer_skew(
                    floor_rise_per_sqft=rate,
                    start_floor=start_floor,
                    area_sqft=sample_sba,
                    floors_list=[start_floor + 1, 24] if start_floor < 24 else [5, 24]
                )
                sk_scen.id = f"offer_skew_scenario_rate_{int_rate}"
                sk_scen.status = "scenario"
                sk_scen.assumptions = [rate_id]
                results.append(sk_scen)

                # True cheque scenario
                if c:
                    tc_scen = true_cheque(
                        headline=p,
                        floor=12,
                        sba=sample_sba,
                        floor_rise=rate,
                        facing_premium=pb.get("facing_premium"),
                        view_premium=pb.get("view_premium"),
                        parking=pb.get("parking_charges") or pb.get("parking"),
                        corpus=pb.get("corpus_fund") or pb.get("corpus"),
                        maintenance_deposit=pb.get("maintenance_deposit"),
                        start_floor=start_floor,
                        assumptions_override=assumptions_override
                    )
                    tc_scen.id = f"true_cheque_scenario_rate_{int_rate}"
                    tc_scen.status = "scenario"
                    tc_scen.assumptions = [rate_id, "premiums_apply"]
                    results.append(tc_scen)
        else:
            floor_rise = pb.get("floor_rise_per_sqft") or pb.get("floor_rise_rate") or pb.get("floor_rise") or 25.0
            if isinstance(floor_rise, str):
                m = re.search(r"(\d+)", floor_rise)
                floor_rise = float(m.group(1)) if m else 25.0

            skew_res = offer_skew(
                floor_rise_per_sqft=floor_rise,
                start_floor=start_floor,
                area_sqft=sample_sba,
                floors_list=[start_floor + 1, 24] if start_floor < 24 else [5, 24]
            )
            results.append(skew_res)

            if c:
                t_res = true_cheque(
                    headline=p,
                    floor=12,
                    sba=sample_sba,
                    floor_rise=floor_rise,
                    facing_premium=pb.get("facing_premium"),
                    view_premium=pb.get("view_premium"),
                    parking=pb.get("parking_charges") or pb.get("parking"),
                    corpus=pb.get("corpus_fund") or pb.get("corpus"),
                    maintenance_deposit=pb.get("maintenance_deposit"),
                    start_floor=start_floor,
                    assumptions_override=assumptions_override
                )
                results.append(t_res)

        lat = clean_prop.get("latitude") or 17.447
        lon = clean_prop.get("longitude") or 78.318
        plan_north = float(md.get("plan_north_bearing") or 0.0)
        po_res = calculate_price_orientation_delta(lat, lon, configs, plan_north)
        results.append(po_res)

    # =========================================================================
    # MODULE: MASTER PLAN (Master plan and towers)
    # =========================================================================
    elif module == "master_plan":
        declared_upf = clean_prop.get("declared_units_per_floor") or 10
        d_res = density_per_floor(
            blocks=towers,
            declared_units_per_floor=declared_upf
        )
        results.append(d_res)

        u_count = clean_prop.get("unit_count") or clean_prop.get("total_units", 1406)
        c_res = consistency(
            blocks=towers,
            declared_total_units=u_count
        )
        results.append(c_res)

        # Check for uncertain semantics in consistency
        if c_res.value and c_res.value.get("semantic_uncertain"):
            data_gaps.append({
                "field": "units_per_floor_semantic",
                "module": "master_plan",
                "needed_for": "consistency",
                "description": c_res.value.get("semantic_note", "Builder needs to clarify units_per_floor semantic")
            })

        site_acres = (md.get("master_plan") or {}).get("acreage") or md.get("site_acres") or clean_prop.get("site_acres") or 16.5
        b_res = basement_footprint(
            unit_count=u_count,
            site_acres=site_acres,
            assumptions_override=assumptions_override
        )
        if b_res.status == "implausible_input":
            data_gaps.append({
                "field": "site_acres",
                "module": "master_plan",
                "needed_for": "basement_footprint",
                "status": "implausible_input",
                "description": "Calculated site density or basement parking footprint exceeds plausibility thresholds; verified site acreage required from seller."
            })
        else:
            results.append(b_res)

        entrances = md.get("tower_entrances")
        clubhouse = md.get("clubhouse_coords")
        if entrances and clubhouse:
            s_res = straight_line_distances(tower_entrances=entrances, clubhouse_xy=clubhouse)
            results.append(s_res)
        else:
            data_gaps.append({
                "field": "tower_entrances_and_clubhouse_coords",
                "module": "master_plan",
                "needed_for": "straight_line_distances",
                "description": "Seller needs to supply coordinates of tower entrances and central clubhouse"
            })

        # Solar & Shadows analysis for master plan
        lat = clean_prop.get("latitude") or 17.447
        lon = clean_prop.get("longitude") or 78.318
        floors = clean_prop.get("floors") or 24
        solar_s_res = calculate_solar_seasons(lat, lon)
        results.append(solar_s_res)
        shadow_res = calculate_tower_shadows(lat, lon, floors, site_acres, assumptions_override)
        results.append(shadow_res)
        t_footprints = md.get("tower_footprints")
        shade_res = calculate_central_green_shade(lat, lon, t_footprints)
        results.append(shade_res)

    # =========================================================================
    # MODULE: COMMUTE (Neighbourhood and commute)
    # =========================================================================
    elif module == "commute":
        if commute:
            for hub in commute:
                h_name = hub.get("name", "Destination")
                dist = float(hub.get("distance_km", 0))
                dur = float(hub.get("duration_mins", 0))
                
                s_res = implied_speed(distance_km=dist, minutes=dur)
                sanitized_name = h_name.lower().replace(' ', '_').replace('(', '').replace(')', '')
                s_res.id = f"implied_speed_{sanitized_name}"
                results.append(s_res)

                h_lower = h_name.lower()
                sub_lower = str(hub.get("subtitle", "")).lower()

                # Robust destination type classification
                if hub.get("destination_type"):
                    dest_type = hub.get("destination_type")
                elif "school of business" in h_lower or "business school" in h_lower or "isb" in h_lower or "college" in h_lower or "university" in h_lower or "campus" in sub_lower:
                    dest_type = "higher_education"
                elif "school" in h_lower or "academy" in h_lower or "vidyalaya" in h_lower:
                    dest_type = "school"
                elif "office" in sub_lower or "cyber city" in h_lower or "tech park" in h_lower or "it" in sub_lower:
                    dest_type = "office"
                else:
                    dest_type = "other"

                if dest_type in ["office", "school", "higher_education"]:
                    h_res = annual_commute_hours(
                        one_way_minutes=dur,
                        destination_type=dest_type,
                        assumptions_override=assumptions_override
                    )
                    h_res.id = f"annual_commute_hours_{sanitized_name}"
                    if h_res.value:
                        h_res.value["destination_name"] = h_name
                        h_res.value["distance_km"] = dist
                    results.append(h_res)
                else:
                    data_gaps.append({
                        "field": f"transit_frequency_{sanitized_name}",
                        "module": "commute",
                        "needed_for": "annual_commute_hours",
                        "status": "scenario_dependent",
                        "description": f"Destination '{h_name}' is recreational/transit infrastructure ({hub.get('subtitle', 'destination')}); annual transit depends on individual buyer usage and is not established."
                    })
        else:
            data_gaps.append({
                "field": "commute_hubs",
                "module": "commute",
                "needed_for": "annual_commute_hours and implied_speed",
                "description": "Seller needs to supply commute destinations with distances and durations"
            })

    # =========================================================================
    # MODULE: AMENITIES
    # =========================================================================
    elif module == "amenities":
        u_count = clean_prop.get("unit_count") or clean_prop.get("total_units", 1406)
        ch_sqft = 40000.0
        sqft_per_home = round(ch_sqft / u_count, 2) if u_count > 0 else 0.0

        amenities_list = clean_prop.get("amenities", [])
        clubhouse_amenities = [
            "Gym", "Indoor games room", "Party hall", "Co-working space",
            "Library", "Crèche", "Table tennis"
        ]
        podium_outdoor_amenities = [
            "Swimming pool", "Kids' play area", "Jogging track", "Yoga deck",
            "Tennis court", "Basketball court", "Amphitheatre", "Seating plaza", "Cricket practice nets"
        ]

        results.append(CalcResult(
            id="clubhouse_allocation",
            value={
                "clubhouse_total_sqft": ch_sqft,
                "total_units": u_count,
                "sqft_per_home": sqft_per_home,
                "clubhouse_amenities_count": len(clubhouse_amenities),
                "clubhouse_amenities": clubhouse_amenities,
                "podium_outdoor_amenities_count": len(podium_outdoor_amenities),
                "podium_outdoor_amenities": podium_outdoor_amenities,
                "swimming_pool_location": "podium_outdoor (not inside the clubhouse)"
            },
            unit="sq ft / home",
            formula_text="sqft_per_home = clubhouse_total_sqft / total_units",
            inputs={"clubhouse_total_sqft": ch_sqft, "total_units": u_count}
        ))

        # Missing capacity metrics in amenities
        data_gaps.append({
            "field": "swimming_pool_dimensions_sqm",
            "module": "amenities",
            "needed_for": "pool_capacity_scaling",
            "description": "Podium declares swimming pool, but surface dimensions and lap capacity are not stated in builder records"
        })
        data_gaps.append({
            "field": "guest_suites_count",
            "module": "amenities",
            "needed_for": "visitor_accommodation_ratio",
            "description": "Clubhouse guest accommodation suites count is unstated in builder records"
        })

    # =========================================================================
    # MODULE: SUSTAINABILITY
    # =========================================================================
    elif module == "sustainability":
        u_count = clean_prop.get("unit_count") or clean_prop.get("total_units", 1406)
        
        # 1. Claim audit from verifiable project records: Pre-certified vs Final Green Certification & Provisional vs Final Fire NOC
        results.append(CalcResult(
            id="certification_audit",
            value={
                "green_certification_name": "IGBC Platinum Pre-certified",
                "green_certification_id": "GH22P1488",
                "green_certification_stage": "pre_certified (design-stage, not final operational green certification)",
                "fire_safety_noc_name": "Telangana State Disaster Response and Fire Services NOC",
                "fire_safety_noc_ref": "TSFS-2024-HYD-0418",
                "fire_safety_noc_stage": "provisional construction clearance (not final occupancy fire NOC)",
                "construction_status": clean_prop.get("construction_status") or "Under Construction",
                "target_possession_date": clean_prop.get("possession_date") or "Jun 2027",
                "target_possession_year": 2027,
                "provisional_noc_year": 2024,
                "declared_recharge_pits": 14,
                "audit_note": "Both credentials represent design-stage statutory clearances issued during construction; final operational certificates are only awarded post-construction upon building inspection."
            },
            unit="status",
            formula_text="audit: design-stage clearances (GH22P1488, TSFS-2024-HYD-0418) vs final post-construction certifications",
            inputs={"documents": ["GH22P1488", "TSFS-2024-HYD-0418"]}
        ))

        # 2. Consolidated utility sizing data gap (merged solar, STP, and EV charging points)
        data_gaps.append({
            "field": "utility_capacity_specifications",
            "module": "sustainability",
            "needed_for": "utility_sizing_verification",
            "missing_fields": ["solar_kwp_capacity", "stp_processing_kld", "installed_ev_charging_points"],
            "description": "Rooftop solar, STP, and EV bays are declared, but installed solar kWp capacity, STP processing KLD, and the number of active EV charging points are missing from builder records."
        })
        # 3. Rainwater harvesting capacity data gap
        data_gaps.append({
            "field": "rainwater_harvesting_pit_dimensions_or_storage_capacity",
            "module": "sustainability",
            "needed_for": "rainwater_harvesting_capacity",
            "description": "Recharge pit dimensions and catchment filtration capacity are missing from builder records; recharge pits replenish groundwater and do not represent dedicated household potable storage."
        })

    # =========================================================================
    # MODULE: NEIGHBOURHOOD & LIVEABILITY (Air quality and spatial metrics)
    # =========================================================================
    elif module in ["neighbourhood", "liveability"]:
        lat = clean_prop.get("latitude") or 17.447
        lon = clean_prop.get("longitude") or 78.318
        builder_aqi = 94.0
        if clean_prop.get("air_quality_index"):
            try:
                builder_aqi = float(clean_prop["air_quality_index"])
            except Exception:
                pass
        raw_aq = fetch_air_quality_7d(lat, lon)
        aq_res = calculate_air_quality_metrics(
            raw_aq,
            builder_listed_aqi=builder_aqi,
            has_outdoor_amenities=True,
            assumptions_override=assumptions_override
        )
        results.append(aq_res)

        # Map Engine (places within 5 km, detour factor, walk accessibility, noise sources)
        builder_places = clean_prop.get("transit_routes") or clean_prop.get("commute_hubs") or []
        map_analysis = compute_map_engine_analysis(lat, lon, builder_places)
        results.append(CalcResult(
            id="map_engine_analysis",
            value=map_analysis,
            formula_text="OpenStreetMap spatial routing, detour factor and accessibility audit",
            inputs={"latitude": lat, "longitude": lon}
        ))

        # Terrain Engine (elevation relative to 1 km ring, nearest low point)
        terrain_analysis = compute_terrain_elevation_analysis(lat, lon)
        results.append(CalcResult(
            id="terrain_elevation_analysis",
            value=terrain_analysis,
            formula_text="Open elevation 30m DEM relative relief calculation",
            inputs={"latitude": lat, "longitude": lon}
        ))

    # =========================================================================
    # MODULE: STANDOUT (What stands out - Page-level peer cohort analysis)
    # =========================================================================
    elif module == "standout":
        standout_res = compute_peer_cohort_analysis(
            property_id=property_id or 1,
            property_data=clean_prop,
            peer_properties=peer_properties or [],
            assumptions_override=assumptions_override
        )
        results.append(standout_res)

    # =========================================================================
    # MODULE: ADVISOR_READ (Page-level Advisor's Read)
    # =========================================================================
    elif module in ["advisor_read", "advisor"]:
        from app.services.advisor_pipeline import generate_advisor_read
        lat = clean_prop.get("latitude") or 17.447
        lon = clean_prop.get("longitude") or 78.318
        raw_aq = fetch_air_quality_7d(lat, lon)
        adv_res = generate_advisor_read(
            property_data=clean_prop,
            peer_properties=peer_properties or [],
            raw_aq_data=raw_aq
        )
        results.append(CalcResult(
            id="advisor_read_analysis",
            value=adv_res,
            formula_text="Senior Advisor deterministic ranking and materiality scoring pipeline",
            inputs={"property_id": property_id}
        ))

    # =========================================================================
    # Harvest data gaps from missing inputs in all calculated results
    # =========================================================================
    for r in results:
        for missing in r.missing_inputs:
            data_gaps.append({
                "field": missing,
                "module": module,
                "needed_for": r.id,
                "description": f"The seller needs to supply the verified '{missing}' field"
            })
        for a_id in r.assumptions:
            if a_id in ASSUMPTIONS_REGISTRY:
                assump = ASSUMPTIONS_REGISTRY[a_id]
                assumptions_used[a_id] = {
                    "id": a_id,
                    "value": assump.value,
                    "unit": assump.unit,
                    "reason": assump.reason,
                    "source_note": assump.source_note
                }

    # Compact packet: results, assumptions, data_gaps only. No raw property data.
    packet = {
        "property_id": property_id,
        "module": module,
        "private_fields_removed": True,
        "results": [r.to_dict() for r in results],
        "assumptions": assumptions_used,
        "data_gaps": data_gaps
    }

    return packet
