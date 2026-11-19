from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app import models
from app.services.evidence import build_property_evidence_layer

def compare_properties_evidence(
    property_ids: List[int],
    db: Session,
    buyer_preferences: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Compares 2 to 4 properties systematically based on their evidence layers,
    road connectivity to identical destinations, environmental indicators, and buyer priorities.
    """
    if len(property_ids) < 2 or len(property_ids) > 4:
        raise ValueError("Property comparison requires between 2 and 4 property IDs.")

    properties = db.query(models.Property).filter(models.Property.id.in_(property_ids)).all()
    if len(properties) != len(property_ids):
        found_ids = {p.id for p in properties}
        missing = set(property_ids) - found_ids
        raise ValueError(f"Properties not found in directory: {missing}")

    properties_data: List[Dict[str, Any]] = []

    for prop in properties:
        research = db.query(models.PropertyResearch).filter(
            models.PropertyResearch.property_id == prop.id
        ).first()

        evidence_layer = build_property_evidence_layer(prop, research, db, buyer_preferences)
        items = evidence_layer.get("items", {})

        # Extract normalized metrics
        price_numeric = prop.total_price or 0.0
        area_numeric = prop.area or 0.0
        rate_numeric = round(price_numeric / area_numeric, 2) if price_numeric > 0 and area_numeric > 0 else None

        # Routing metrics
        routes = {}
        for k, it in items.items():
            if k.startswith("EVID-ROUTE-"):
                dest = it.get("value", {}).get("destination")
                if dest:
                    routes[dest] = {
                        "road_distance_km": it["value"].get("road_distance_km"),
                        "estimated_duration_mins": it["value"].get("estimated_duration_mins"),
                        "straight_line_distance_km": it["value"].get("straight_line_distance_km"),
                        "tortuosity_ratio": it["value"].get("tortuosity_ratio")
                    }

        # Air Quality
        aqi_item = items.get("EVID-ENV-AQI", {})
        aqi_val = aqi_item.get("value", {}) if isinstance(aqi_item.get("value"), dict) else {}

        # POI summary
        poi_counts = {}
        for cat in ["Public Transport", "Education", "Healthcare", "Daily Needs", "Lifestyle & Recreation", "Public Services"]:
            for k, it in items.items():
                if k.startswith("EVID-LOC-POI-") and cat in it.get("label", ""):
                    poi_counts[cat] = it.get("value", {}).get("count") or 0

        properties_data.append({
            "id": prop.id,
            "name": prop.name,
            "locality": prop.locality,
            "property_type": prop.property_type,
            "asking_price": prop.asking_price,
            "total_price": price_numeric,
            "area": area_numeric,
            "area_unit": prop.area_unit,
            "rate_per_sqft": rate_numeric,
            "construction_status": prop.construction_status,
            "routes": routes,
            "air_quality": {
                "us_aqi": aqi_val.get("index_value"),
                "category": aqi_val.get("category", "N/A"),
                "scale": "US EPA 2024"
            },
            "amenities_count": poi_counts,
            "evidence_count": len(items),
            "research_status": research.status if research else "unresearched",
            "evidence_snapshot_id": f"SNAP-{prop.id}-{research.last_researched_at.strftime('%Y%m%d%H%M') if research and research.last_researched_at else 'UNR'}"
        })

    # Comparative Dimensional Trade-offs
    tradeoffs_summary: List[str] = []

    # 1. Price per sq ft comparison
    valid_rates = [(p["name"], p["rate_per_sqft"]) for p in properties_data if p["rate_per_sqft"] is not None]
    if len(valid_rates) >= 2:
        sorted_rates = sorted(valid_rates, key=lambda x: x[1])
        cheapest = sorted_rates[0]
        priciest = sorted_rates[-1]
        diff_pct = round(((priciest[1] - cheapest[1]) / cheapest[1]) * 100, 1)
        tradeoffs_summary.append(
            f"Unit Rate Spread: {cheapest[0]} offers the lowest asking quote at ₹{cheapest[1]:,.0f}/sq ft, while {priciest[0]} is quoted {diff_pct}% higher at ₹{priciest[1]:,.0f}/sq ft."
        )

    # 2. Road Commute comparison to common destination
    common_destinations = set.intersection(*[set(p["routes"].keys()) for p in properties_data]) if properties_data else set()
    for dest in common_destinations:
        route_comp = [(p["name"], p["routes"][dest]["road_distance_km"], p["routes"][dest]["estimated_duration_mins"]) for p in properties_data]
        sorted_commute = sorted(route_comp, key=lambda x: x[1] if x[1] is not None else 9999)
        quickest = sorted_commute[0]
        longest = sorted_commute[-1]
        if quickest[1] is not None and longest[1] is not None:
            tradeoffs_summary.append(
                f"Commute to {dest}: {quickest[0]} is {quickest[1]} km (~{quickest[2]} mins drive), whereas {longest[0]} requires {longest[1]} km (~{longest[2]} mins drive) based on OSRM road graph calculations."
            )

    # 3. Air Quality comparison
    valid_aqis = [(p["name"], p["air_quality"]["us_aqi"], p["air_quality"]["category"]) for p in properties_data if p["air_quality"]["us_aqi"] is not None]
    if len(valid_aqis) >= 2:
        sorted_aqi = sorted(valid_aqis, key=lambda x: x[1])
        cleanest = sorted_aqi[0]
        heaviest = sorted_aqi[-1]
        tradeoffs_summary.append(
            f"Atmospheric Quality: {cleanest[0]} records Copernicus CAMS AQI {cleanest[1]} ({cleanest[2]}), compared to {heaviest[0]} with AQI {heaviest[1]} ({heaviest[2]})."
        )

    # 4. Evidence Quality & Research Freshness Comparison
    stale_or_partial = [p["name"] for p in properties_data if p["research_status"] != "completed"]
    if stale_or_partial:
        tradeoffs_summary.append(
            f"Evidence Quality Caveat: Research for {', '.join(stale_or_partial)} is currently {properties_data[0]['research_status']}; uncorroborated items must be re-verified."
        )

    # 5. Buyer-Personalized Priority Trade-offs (if preferences supplied)
    if buyer_preferences:
        # Budget check
        budget_max = buyer_preferences.get("budget_max")
        if budget_max:
            within_budget = [p["name"] for p in properties_data if p["total_price"] and p["total_price"] <= budget_max]
            over_budget = [p["name"] for p in properties_data if p["total_price"] and p["total_price"] > budget_max]
            if within_budget and over_budget:
                tradeoffs_summary.append(
                    f"Buyer Budget Target (₹{budget_max:,.0f}): {', '.join(within_budget)} fits within target ceiling, while {', '.join(over_budget)} exceeds target asking quote."
                )

        # Priority checks (e.g., schools, transit, healthcare, air_quality)
        priorities = buyer_preferences.get("priorities", {})
        if priorities.get("schools", 0) >= 4:
            sorted_schools = sorted(properties_data, key=lambda p: (p["amenities_count"].get("Education") or 0), reverse=True)
            top_school = sorted_schools[0]
            top_edu_count = top_school["amenities_count"].get("Education") or 0
            if top_edu_count > 0:
                tradeoffs_summary.append(
                    f"Education Priority: {top_school['name']} offers greatest density of mapped schooling facilities ({top_edu_count} within 5km)."
                )
            else:
                tradeoffs_summary.append(
                    "Education Priority: Zero schools are mapped in OpenStreetMap within 5km for any of the compared properties; buyers must manually verify local educational institutions."
                )
        if priorities.get("transit", 0) >= 4:
            sorted_transit = sorted(properties_data, key=lambda p: (p["amenities_count"].get("Public Transport") or 0), reverse=True)
            top_transit = sorted_transit[0]
            top_transit_count = top_transit["amenities_count"].get("Public Transport") or 0
            if top_transit_count > 0:
                tradeoffs_summary.append(
                    f"Public Transit Priority: {top_transit['name']} has highest mapped public transit density ({top_transit_count} stops/stations within 5km)."
                )
            else:
                tradeoffs_summary.append(
                    "Public Transit Priority: Zero public transit stops are mapped within 5km in OpenStreetMap for these properties."
                )

    # Persona suitability recommendation without arbitrary universal winner
    persona_recommendations = [
        {
            "persona": "Budget-Conscious Value Seeker",
            "recommended_property_id": min(properties_data, key=lambda p: p["rate_per_sqft"] or 9999999)["id"],
            "rationale": "Offers the most economical unit entry rate per square foot among compared listings."
        },
        {
            "persona": "Daily Urban Commuter",
            "recommended_property_id": min(properties_data, key=lambda p: next(iter(p["routes"].values()), {}).get("road_distance_km", 99999))["id"] if properties_data else properties_data[0]["id"],
            "rationale": "Minimizes physical road distance and vehicle wear-and-tear to key transit/employment corridors."
        }
    ]

    # If buyer provided personal intended use, add tailored persona
    if buyer_preferences and buyer_preferences.get("intended_use"):
        use = buyer_preferences.get("intended_use")
        if use in ["family_home", "family"]:
            best_family = max(properties_data, key=lambda p: ((p["amenities_count"].get("Education") or 0) + (p["amenities_count"].get("Healthcare") or 0)))
            total_fam = (best_family['amenities_count'].get('Education') or 0) + (best_family['amenities_count'].get('Healthcare') or 0)
            if total_fam > 0:
                persona_recommendations.append({
                    "persona": "Family Home Seeker (Buyer Profile)",
                    "recommended_property_id": best_family["id"],
                    "rationale": f"Maximized aggregate access to educational and healthcare facilities mapped nearby ({best_family['amenities_count'].get('Education', 0)} schools, {best_family['amenities_count'].get('Healthcare', 0)} healthcare)."
                })
            else:
                persona_recommendations.append({
                    "persona": "Family Home Seeker (Buyer Profile)",
                    "recommended_property_id": best_family["id"],
                    "rationale": "Neither property has corroborated schools or healthcare facilities mapped within 5km on OpenStreetMap; on-site reconnaissance is mandatory for families."
                })

    return {
        "properties": properties_data,
        "comparison_matrix": {
            "attributes": [
                {"key": "locality", "label": "Locality"},
                {"key": "property_type", "label": "Property Type"},
                {"key": "asking_price", "label": "Stated Asking Price"},
                {"key": "rate_per_sqft", "label": "Rate / Sq Ft (INR)", "unit": "INR/sq ft"},
                {"key": "area", "label": "Built-up Area", "unit": "sq ft"},
                {"key": "construction_status", "label": "Construction Stage"}
            ]
        },
        "tradeoffs_summary": tradeoffs_summary,
        "persona_recommendations": persona_recommendations,
        "buyer_preferences_applied": buyer_preferences,
        "disclaimer": "This multi-property comparison provides objective dimensional trade-offs based strictly on retrieved OpenStreetMap, OSRM road graph, and Copernicus CAMS metrics. It does not declare an absolute universal winner because property suitability depends on individual buyer constraints, legal vetting, and financing terms."
    }
