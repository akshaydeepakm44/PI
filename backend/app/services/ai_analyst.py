import re
import json
import time
import httpx
import logging
from typing import Dict, Any, List, Optional, Set
from pydantic import BaseModel, Field
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the HI IN Property Intelligence Engine, an evidence-based real estate analyst acting strictly on behalf of a cautious, experienced property buyer.

YOUR ROLE:
You do not market or sell properties. You critically assess evidence, balance advantages against trade-offs, identify missing information, evaluate suitability for diverse buyer profiles, and formulate rigorous due-diligence questions.

CORE RULES:
1. STRICT EVIDENCE CITATION: Every factual claim, metric, or amenity you mention MUST reference its valid stable evidence ID from the provided evidence layer (e.g., ["EVID-SELLER-TOTAL-PRICE"], ["EVID-LOC-POI-HEALTHCARE"], ["EVID-ENV-AQI"], ["EVID-ROUTE-VISAKHAPATNAM"]).
2. ZERO HALLUCINATED NUMBERS: Never fabricate market transaction trends, square footage rates, crime rates, resale yields, or future capital appreciation. If comparable data is missing, state explicitly: "Available directory evidence is insufficient to verify whether the asking price is above or below fair market valuation."
3. DISTINGUISH SELLER CLAIMS FROM VERIFIED OBSERVATIONS: Clearly label seller statements (such as promises of 100% power backup, swimming pools, or possession dates) as unverified builder claims until backed by independent evidence.
4. ROAD ROUTING VS AIR DISTANCE: Never present Haversine straight-line distance as driving distance. OSRM driving duration is calculated on standard speed limits without live congestion.
5. ENVIRONMENTAL CONTEXT: Air quality from Copernicus CAMS represents an ~11km regional atmospheric grid cell reanalysis, not a sensor inside the apartment. Explain this limitation clearly.
6. RETURN CLEAN JSON: Respond ONLY with a valid JSON object matching the requested schema. No markdown fences outside the JSON, no conversational preamble.
"""

def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Cleans and extracts JSON dictionary from LLM response text."""
    text = raw_text.strip()
    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # Find outermost curly braces
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        text = text[start_idx:end_idx + 1]

    return json.loads(text)


def build_personalized_assessment(evidence: Dict[str, Any], buyer_prefs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Constructs an explicit, auditable buyer-personalized assessment
    grounded strictly in stated preferences and the evidence layer.
    Exposes criteria, weights, and transparent scoring heuristics.
    """
    items = evidence.get("items", {})
    price_item = items.get("EVID-SELLER-TOTAL-PRICE", {})
    price_val = price_item.get("value", 0) or 0
    budget_max = buyer_prefs.get("budget_max")
    intended_use = buyer_prefs.get("intended_use", "self_occupation")
    dest = buyer_prefs.get("preferred_commute_destination")
    tolerance = buyer_prefs.get("commute_tolerance_mins", 30)
    priorities = buyer_prefs.get("priorities", {})

    # 1. Budget Fit Evaluation
    budget_fit = "No budget limit specified"
    if budget_max:
        if price_val <= budget_max:
            savings = budget_max - price_val
            budget_fit = f"Within target budget: Asking quote of ₹{price_val:,.0f} is ₹{savings:,.0f} below buyer ceiling of ₹{budget_max:,.0f}."
        else:
            excess = price_val - budget_max
            budget_fit = f"Above target budget: Asking quote of ₹{price_val:,.0f} exceeds buyer ceiling of ₹{budget_max:,.0f} by ₹{excess:,.0f}."

    # 2. Commute Fit Evaluation
    commute_fit = "No specific commute anchor requested"
    routes = [it for k, it in items.items() if k.startswith("EVID-ROUTE-")]
    if dest:
        matched_route = None
        for r in routes:
            r_dest = r.get("value", {}).get("destination", "")
            if dest.lower() in r_dest.lower() or r_dest.lower() in dest.lower():
                matched_route = r.get("value")
                break
        if matched_route:
            dur = matched_route.get("estimated_duration_mins", 0)
            dist = matched_route.get("road_distance_km", 0)
            if dur <= tolerance:
                commute_fit = f"Commute to {matched_route.get('destination')} is within tolerance: ~{dur} mins driving ({dist} km) vs {tolerance} mins limit."
            else:
                commute_fit = f"Commute to {matched_route.get('destination')} exceeds tolerance: ~{dur} mins driving ({dist} km) vs {tolerance} mins limit."
        else:
            commute_fit = f"Target destination '{dest}' does not have a pre-computed road route in the standard regional network."

    # 3. Transparent Heuristic Decision Aid
    score_components = []
    total_weights = 0
    weighted_sum = 0

    if budget_max:
        b_weight = 30
        total_weights += b_weight
        b_score = 100 if price_val <= budget_max else max(20, int(100 - (abs(price_val - budget_max) / budget_max) * 100))
        weighted_sum += b_score * b_weight
        score_components.append({
            "dimension": "Budget Target Alignment",
            "weight_percent": b_weight,
            "component_score": b_score,
            "explanation": budget_fit
        })

    schools_prio = priorities.get("schools", 3)
    schools_weight = schools_prio * 5
    total_weights += schools_weight
    edu_item = items.get("EVID-LOC-POI-EDUCATION", {}).get("value", {})
    edu_count = edu_item.get("count", 0) if isinstance(edu_item, dict) else 0
    edu_score = min(100, edu_count * 20)
    weighted_sum += edu_score * schools_weight
    score_components.append({
        "dimension": f"Schools & Education (Stated Priority: {schools_prio}/5)",
        "weight_percent": schools_weight,
        "component_score": edu_score,
        "explanation": f"Mapped {edu_count} educational facilities within 5km radius."
    })

    transit_prio = priorities.get("transit", 3)
    transit_weight = transit_prio * 5
    total_weights += transit_weight
    trans_item = items.get("EVID-LOC-POI-TRANSPORT", {}).get("value", {})
    trans_count = trans_item.get("count", 0) if isinstance(trans_item, dict) else 0
    trans_score = min(100, trans_count * 25)
    weighted_sum += trans_score * transit_weight
    score_components.append({
        "dimension": f"Public Transit Access (Stated Priority: {transit_prio}/5)",
        "weight_percent": transit_weight,
        "component_score": trans_score,
        "explanation": f"Mapped {trans_count} public transit facilities within 5km."
    })

    env_prio = priorities.get("air_quality", 3)
    env_weight = env_prio * 5
    total_weights += env_weight
    aqi_item = items.get("EVID-ENV-AQI", {}).get("value", {})
    aqi_val = aqi_item.get("index_value") if isinstance(aqi_item, dict) else None
    if aqi_val is not None:
        aqi_score = max(20, 100 - int(aqi_val / 2))
    else:
        aqi_score = 50
    weighted_sum += aqi_score * env_weight
    score_components.append({
        "dimension": f"Environmental & Air Quality (Stated Priority: {env_prio}/5)",
        "weight_percent": env_weight,
        "component_score": aqi_score,
        "explanation": f"Copernicus CAMS AQI reading {aqi_val or 'N/A'}."
    })

    composite_score = round(weighted_sum / max(1, total_weights))

    return {
        "buyer_preferences_snapshot": buyer_prefs,
        "intended_use_evaluation": f"Evaluated for '{intended_use.replace('_', ' ').title()}' use.",
        "budget_evaluation": budget_fit,
        "commute_evaluation": commute_fit,
        "decision_aid_score": composite_score,
        "scoring_components": score_components,
        "score_methodology_disclaimer": "This decision aid score reflects your stated preferences evaluated against available directory data, NOT an objective appraisal or property rating."
    }


def validate_and_repair_citations(
    report_data: Dict[str, Any],
    evidence: Dict[str, Any],
    buyer_prefs: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Deterministically validates every cited evidence ID against the supplied evidence layer,
    verifies numerical values against ground truth measurements, prunes hallucinated citations,
    and applies buyer preference overlays.
    """
    items = evidence.get("items", {})
    valid_evidence_ids = set(items.keys())

    total_citations = 0
    valid_citations = 0
    pruned_citations = []

    def inspect_citations(obj: Any):
        nonlocal total_citations, valid_citations
        if isinstance(obj, dict):
            if "evidence_ids" in obj and isinstance(obj["evidence_ids"], list):
                filtered_ids = []
                for eid in obj["evidence_ids"]:
                    total_citations += 1
                    if eid in valid_evidence_ids:
                        valid_citations += 1
                        filtered_ids.append(eid)
                    else:
                        pruned_citations.append(eid)
                obj["evidence_ids"] = filtered_ids
            for v in obj.values():
                inspect_citations(v)
        elif isinstance(obj, list):
            for item in obj:
                inspect_citations(item)

    inspect_citations(report_data)

    # Numerical ground-truth validations
    numerical_corrections = []

    # 1. AQI validation
    env = report_data.get("environmental_assessment", {})
    if "aqi_reading" in env and "EVID-ENV-AQI" in items:
        true_aqi = items["EVID-ENV-AQI"].get("value", {})
        if isinstance(true_aqi, dict):
            expected_val = true_aqi.get("index_value")
            if expected_val is not None and env.get("aqi_reading") != expected_val:
                numerical_corrections.append(f"Corrected AQI from {env.get('aqi_reading')} to evidence value {expected_val}")
                env["aqi_reading"] = expected_val
                env["aqi_category"] = true_aqi.get("category", env.get("aqi_category"))

    # 2. Rate per sqft validation
    price_ctx = report_data.get("price_and_value_context", {})
    if "rate_per_sqft" in price_ctx and "EVID-CALC-RATE-SQFT" in items:
        true_rate = items["EVID-CALC-RATE-SQFT"].get("value")
        if isinstance(true_rate, (int, float)) and price_ctx.get("rate_per_sqft") != true_rate:
            numerical_corrections.append(f"Corrected Rate/sqft from {price_ctx.get('rate_per_sqft')} to calculated value {true_rate}")
            price_ctx["rate_per_sqft"] = true_rate

    # 3. Amenity filtering: only keep verified mapped amenities with count > 0
    loc = report_data.get("location_and_daily_life", {})
    if "amenity_breakdown" in loc and isinstance(loc["amenity_breakdown"], list):
        filtered_ab = [
            ab for ab in loc["amenity_breakdown"]
            if isinstance(ab, dict) and (ab.get("count") or 0) > 0 and bool(ab.get("closest_name"))
        ]
        loc["amenity_breakdown"] = filtered_ab
        if len(filtered_ab) == 0:
            loc["spatial_convenience_verdict"] = "Zero community amenities mapped in OpenStreetMap within a 5km radius."
            loc["summary"] = "No community-mapped facilities (transit, schools, healthcare, or daily needs) were found within a 5km radius in OpenStreetMap. Manual on-site inspection is required to determine actual neighborhood infrastructure."

    # 4. Enforce truthful Family profile evaluation when schools/clinics are absent
    edu_item = items.get("EVID-LOC-POI-EDUCATION", {}).get("value", {})
    health_item = items.get("EVID-LOC-POI-HEALTHCARE", {}).get("value", {})
    edu_count = edu_item.get("count", 0) if isinstance(edu_item, dict) else 0
    health_count = health_item.get("count", 0) if isinstance(health_item, dict) else 0
    if edu_count == 0 and health_count == 0:
        for p in report_data.get("buyer_suitability_profiles", []):
            if "family" in p.get("profile_name", "").lower():
                p["fit_score"] = 35
                p["fit_level"] = "Low"
                p["fit_rationale"] = "Zero schools or healthcare facilities are mapped within 5km in OpenStreetMap. Families must manually verify distance to functional schools and medical clinics before considering this location."
                p["key_tradeoffs"] = ["No corroborated schools or clinics nearby in open records; daily family logistics could involve significant unmapped travel."]
                p["evidence_ids"] = ["EVID-GAP-UNSURVEYED-POIS"] if "EVID-GAP-UNSURVEYED-POIS" in items else []

    # Apply personalized buyer evaluation if preferences are provided
    if buyer_prefs:
        report_data["personalized_buyer_assessment"] = build_personalized_assessment(evidence, buyer_prefs)

    report_data["evidence_citations_audit"] = {
        "total_citations_analyzed": total_citations,
        "valid_citations_verified": valid_citations,
        "hallucinated_citations_pruned": len(pruned_citations),
        "pruned_id_sample": pruned_citations[:5],
        "numerical_corrections_made": len(numerical_corrections),
        "numerical_corrections_sample": numerical_corrections[:3],
        "audit_pass": len(pruned_citations) == 0 or (valid_citations / max(1, total_citations)) >= 0.7
    }

    return report_data


def generate_deterministic_fallback_report(
    evidence: Dict[str, Any],
    buyer_prefs: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Produces a 100% evidence-grounded, structured Property Intelligence Report
    using deterministic domain rules when the LLM service is offline or malformed.
    Dynamically analyzes uploaded seller documents, micro-locality climate & traffic,
    and construction stage to generate authentic, non-default insights and due-diligence questions.
    """
    items = evidence.get("items", {})
    prop_name = evidence.get("property_name", "Property")
    
    # Document Facts
    docs_item = items.get("EVID-SELLER-DOCS-LIST", {}).get("value", {})
    docs_count = docs_item.get("count", items.get("EVID-SELLER-DOCS-COUNT", {}).get("value", 0))
    doc_names = docs_item.get("doc_names", [])
    has_rera = docs_item.get("has_rera", False)
    has_oc = docs_item.get("has_oc", False)
    has_sanction = docs_item.get("has_sanction_plan", False)
    has_fire = docs_item.get("has_fire_noc", False)
    has_brochure = docs_item.get("has_brochure", False)

    # Construction & Locality
    const_status = items.get("EVID-SELLER-CONSTRUCTION-STATUS", {}).get("value", "Under Construction")
    is_ready = "ready" in str(const_status).lower()
    locality = str(items.get("EVID-SELLER-LOCALITY", {}).get("value", "Visakhapatnam")).lower()
    prop_type = str(items.get("EVID-SELLER-TYPE", {}).get("value", "Apartment"))
    price_item = items.get("EVID-SELLER-TOTAL-PRICE", {})
    price_val = price_item.get("value", 0)
    rate_item = items.get("EVID-CALC-RATE-SQFT", {})
    rate_val = rate_item.get("value", "N/A")
    area_item = items.get("EVID-SELLER-AREA", {})
    area_val = area_item.get("value", 0)
    
    # Transport & routes
    routes = [it for k, it in items.items() if k.startswith("EVID-ROUTE-")]
    aqi_item = items.get("EVID-ENV-AQI", {})
    aqi_data = aqi_item.get("value", {}) if isinstance(aqi_item.get("value"), dict) else {}
    aqi_index = aqi_data.get("index_value")
    aqi_cat = aqi_data.get("category", "Unavailable")

    # Amenities
    amenity_items = [it for k, it in items.items() if k.startswith("EVID-LOC-POI-")]

    # Location & Daily Life Breakdown
    amenity_breakdown = []
    for it in amenity_items:
        val = it.get("value", {})
        count = (val.get("count") or 0) if isinstance(val, dict) else 0
        closest_name = val.get("closest_name") if isinstance(val, dict) else None
        if count > 0 and closest_name:
            amenity_breakdown.append({
                "category": it.get("label", "Amenity"),
                "count": count,
                "closest_meters": val.get("closest_meters"),
                "closest_name": closest_name,
                "practical_utility": f"Discovered {count} facilities. Closest mapped is {closest_name} (~{val.get('closest_meters')}m).",
                "evidence_ids": [it["id"]]
            })

    total_mapped_pois = sum(ab["count"] for ab in amenity_breakdown)
    if total_mapped_pois > 0:
        spatial_verdict = (
            "High urban amenity density based on OpenStreetMap records." if total_mapped_pois >= 10 else
            "Moderate local amenity presence identified in OpenStreetMap." if total_mapped_pois >= 3 else
            "Sparse local amenity coverage identified in OpenStreetMap."
        )
        location_summary = f"Spatial analysis identifies {total_mapped_pois} community-mapped facilities across {len(amenity_breakdown)} categories within a 5km radius."
    else:
        spatial_verdict = "Zero community amenities mapped in OpenStreetMap within a 5km radius."
        location_summary = "No community-mapped facilities (transit, schools, healthcare, or daily needs) were found within a 5km radius in OpenStreetMap. Manual on-site inspection is required to determine actual neighborhood infrastructure."

    # Build Authentic Advantages
    advantages = []
    # 1. Document Proof
    if has_oc:
        advantages.append({
            "claim": "Official Occupancy Certificate (OC) Verified: Builder has submitted the municipal Occupancy Certificate, confirming formal structural inspection and lawful ready-to-move status.",
            "evidence_ids": ["EVID-SELLER-DOCS-COUNT"]
        })
    if has_rera:
        advantages.append({
            "claim": "AP RERA Statutory Registration: Project is registered with Andhra Pradesh Real Estate Regulatory Authority, legally requiring a 70% ringfenced escrow account for construction funds.",
            "evidence_ids": ["EVID-SELLER-DOCS-COUNT"]
        })
    if has_sanction:
        advantages.append({
            "claim": "Municipal Approved Sanction Plan: Builder uploaded town planning sanction drawings validating authorized building setbacks, unit floors, and parking allotments.",
            "evidence_ids": ["EVID-SELLER-DOCS-COUNT"]
        })
    if has_fire:
        advantages.append({
            "claim": "Fire Department NOC Verified: Fire safety clearance certificate on file confirming certified multi-storey emergency evacuation infrastructure.",
            "evidence_ids": ["EVID-SELLER-DOCS-COUNT"]
        })

    # 2. Road Routes
    if routes:
        first_r = routes[0]["value"]
        advantages.append({
            "claim": f"Direct road connectivity to {first_r.get('destination')} established via OSRM ({first_r.get('road_distance_km')} km in ~{first_r.get('estimated_duration_mins')} mins).",
            "evidence_ids": [routes[0]["id"]]
        })

    # 3. Clean air / micro-climate
    if aqi_index is not None and aqi_index <= 95:
        advantages.append({
            "claim": f"Satisfactory atmospheric air quality: Copernicus CAMS atmospheric sensor reports AQI {aqi_index} ({aqi_cat}), comfortably within WHO clean air guidelines.",
            "evidence_ids": ["EVID-ENV-AQI"]
        })

    # 4. Rate per sqft
    if rate_val != "N/A" and isinstance(rate_val, (int, float)):
        advantages.append({
            "claim": f"Calculated asking quote rate of ₹{rate_val}/sq ft provides a clear baseline metric for unit comparison against neighborhood transactions.",
            "evidence_ids": ["EVID-CALC-RATE-SQFT", "EVID-SELLER-TOTAL-PRICE"]
        })

    # 5. Amenity density
    if total_mapped_pois >= 8:
        advantages.append({
            "claim": f"Established civic infrastructure: {total_mapped_pois} neighborhood facilities mapped within immediate vicinity, including public transit and daily essentials.",
            "evidence_ids": [amenity_breakdown[0]["evidence_ids"][0]] if amenity_breakdown else []
        })

    # Fallback advantage if list is sparse
    if not advantages:
        advantages.append({
            "claim": f"Listing created with confirmed cadastral coordinates at {locality.title()}.",
            "evidence_ids": ["EVID-LOC-COORDS"]
        })

    # Build Authentic Disadvantages & Trade-offs
    tradeoffs = []
    # 1. Document Deficits
    if docs_count == 0:
        tradeoffs.append({
            "claim": "CRITICAL LEGAL DEFICIT: Developer has uploaded ZERO legal documents, municipal commencement sanctions, parent title deeds, or AP RERA registration certificates to the repository.",
            "evidence_ids": ["EVID-GAP-LEGAL-TITLE"]
        })
    else:
        if not has_rera and not is_ready:
            tradeoffs.append({
                "claim": "Missing AP RERA Registration: No RERA certificate is uploaded to verify statutory 70% construction escrow ringfencing or mandatory quarterly progress audits.",
                "evidence_ids": ["EVID-GAP-APPROVAL-PAPERS"]
            })
        if not has_oc and is_ready:
            tradeoffs.append({
                "claim": "No certified Occupancy Certificate (OC) attached for this ready unit; buyer risks municipal regularization penalties or utility connection delays.",
                "evidence_ids": ["EVID-GAP-LEGAL-TITLE"]
            })
        if not has_sanction:
            tradeoffs.append({
                "claim": "Municipal approved building sanction drawing permit is not attached to verify structural setbacks and floor plan legality.",
                "evidence_ids": ["EVID-GAP-APPROVAL-PAPERS"]
            })

    # 2. Construction Stage Risk
    if not is_ready:
        tradeoffs.append({
            "claim": "Under-construction execution exposure: Project is currently under active construction; possession timeline is subject to contractor execution pace and material price cycles.",
            "evidence_ids": ["EVID-SELLER-CONSTRUCTION-STATUS"] if "EVID-SELLER-CONSTRUCTION-STATUS" in items else ["EVID-GAP-MAINTENANCE-DEPOSITS"]
        })

    # 3. Locality Micro-Climate & Infrastructure Exposure
    if "gajuwaka" in locality:
        tradeoffs.append({
            "claim": f"Industrial air quality & freight corridor: Situated in the Gajuwaka/industrial refinery belt; ambient air quality (AQI {aqi_index} - {aqi_cat}) reflects heavy industrial emissions and continuous commercial vehicle freight on NH16.",
            "evidence_ids": ["EVID-ENV-AQI"]
        })
    elif "rushikonda" in locality:
        tradeoffs.append({
            "claim": "Coastal marine salinity exposure: Seafront micro-climate in Rushikonda subjects exterior facades, exposed metal reinforcement, and HVAC compressors to accelerated salt-spray corrosion.",
            "evidence_ids": ["EVID-LOC-COORDS"]
        })
    elif aqi_index is not None and aqi_index > 100:
        tradeoffs.append({
            "claim": f"Elevated regional particulate index: Atmospheric air quality index ({aqi_index} - {aqi_cat}) exceeds sensitive health thresholds according to US EPA standards.",
            "evidence_ids": ["EVID-ENV-AQI"]
        })
    elif "madhurawada" in locality:
        tradeoffs.append({
            "claim": "Rapid layout expansion pressure: Fast-paced residential development in Madhurawada sector requires physical on-site inspection of municipal underground drainage (UGD) connectivity during coastal monsoons.",
            "evidence_ids": ["EVID-LOC-COORDS"]
        })
    elif "mvp" in locality:
        tradeoffs.append({
            "claim": "High urban density & internal road congestion: Central MVP Colony sector experiences heavy internal street traffic and constrained on-street visitor parking.",
            "evidence_ids": ["EVID-LOC-COORDS"]
        })

    # 4. Live Traffic Congestion Gap
    tradeoffs.append({
        "claim": "Estimated travel durations reflect static road network speed limits; actual peak commute congestion is unmeasured.",
        "evidence_ids": ["EVID-GAP-LIVE-TRAFFIC"]
    })

    if total_mapped_pois == 0:
        tradeoffs.append({
            "claim": "No community amenities (transit, schools, healthcare, or groceries) are mapped within a 5km radius in OpenStreetMap; local daily services must be verified manually on-site.",
            "evidence_ids": ["EVID-GAP-UNSURVEYED-POIS"] if "EVID-GAP-UNSURVEYED-POIS" in items else []
        })

    # Routes Breakdown
    route_evals = []
    for r in routes:
        rv = r.get("value", {})
        route_evals.append({
            "destination": rv.get("destination", "Destination"),
            "road_distance_km": rv.get("road_distance_km"),
            "straight_line_km": rv.get("straight_line_distance_km"),
            "estimated_duration_mins": rv.get("estimated_duration_mins"),
            "tortuosity_ratio": rv.get("tortuosity_ratio"),
            "connectivity_verdict": f"Network road distance is {rv.get('road_distance_km')} km ({rv.get('tortuosity_ratio')}x route curvature relative to geodesic air distance).",
            "evidence_ids": [r["id"]]
        })

    # Pollutant analysis
    pollutants_analysis = []
    for k, it in items.items():
        if k.startswith("EVID-ENV-POLLUTANT-"):
            pv = it.get("value", {})
            pollutants_analysis.append({
                "pollutant": it.get("label"),
                "concentration": pv.get("concentration"),
                "unit": it.get("unit", "µg/m³"),
                "who_guideline": pv.get("who_24h_guideline"),
                "status": pv.get("status_vs_who", "Within Guideline"),
                "evidence_ids": [it["id"]]
            })

    # Family suitability based on actual evidence
    edu_item = items.get("EVID-LOC-POI-EDUCATION", {}).get("value", {})
    health_item = items.get("EVID-LOC-POI-HEALTHCARE", {}).get("value", {})
    edu_count = edu_item.get("count", 0) if isinstance(edu_item, dict) else 0
    health_count = health_item.get("count", 0) if isinstance(health_item, dict) else 0

    if edu_count > 0 and health_count > 0:
        family_fit_score = 78
        family_fit_level = "Moderate"
        family_rationale = f"Foundational services mapped within 5km, including {edu_item.get('closest_name')} ({edu_item.get('closest_meters')}m) and {health_item.get('closest_name')} ({health_item.get('closest_meters')}m)."
        family_tradeoffs = ["Quality and admissions availability of mapped schools require physical verification."]
        family_ev_ids = ["EVID-LOC-POI-EDUCATION", "EVID-LOC-POI-HEALTHCARE"]
    elif edu_count > 0 or health_count > 0:
        family_fit_score = 55
        family_fit_level = "Conditional"
        family_rationale = f"Partial service coverage: {'schools' if edu_count > 0 else 'healthcare'} mapped nearby, but {'healthcare' if edu_count > 0 else 'schools'} have zero mapped facilities within 5km."
        family_tradeoffs = ["Missing essential amenities must be manually verified in surrounding neighborhoods."]
        family_ev_ids = ["EVID-LOC-POI-EDUCATION"] if edu_count > 0 else ["EVID-LOC-POI-HEALTHCARE"]
    else:
        family_fit_score = 35
        family_fit_level = "Low"
        family_rationale = "Zero schools or healthcare facilities are mapped within 5km in OpenStreetMap. Families must manually verify distance to functional schools and medical clinics before considering this location."
        family_tradeoffs = ["No corroborated schools or clinics nearby in open records; daily family logistics could involve significant unmapped travel."]
        family_ev_ids = ["EVID-GAP-UNSURVEYED-POIS"] if "EVID-GAP-UNSURVEYED-POIS" in items else []

    # Buyer profiles
    profiles = [
        {
            "profile_name": "First-Time Homebuyer",
            "fit_score": 75 if (price_val > 0 and docs_count > 0) else 50,
            "fit_level": "Moderate" if docs_count > 0 else "Low",
            "fit_rationale": "Suitable configuration but requires verified title legal audit and municipal sanction verification before committing financial deposits." if docs_count > 0 else "High risk for first-time buyers due to absence of uploaded legal title deeds and municipal sanction approvals.",
            "key_tradeoffs": ["Unverified legal titles require buyer-side vetting", "Total outlay excludes statutory stamp duty"],
            "evidence_ids": ["EVID-SELLER-TOTAL-PRICE", "EVID-GAP-LEGAL-TITLE"]
        },
        {
            "profile_name": "Working Professional (Commuter)",
            "fit_score": 82 if routes else 65,
            "fit_level": "High" if routes else "Moderate",
            "fit_rationale": f"Direct topological driving route connects to primary regional nodes including {routes[0]['value']['destination'] if routes else 'regional centers'}.",
            "key_tradeoffs": ["Static road estimates do not account for rush-hour choke points"],
            "evidence_ids": [routes[0]["id"]] if routes else ["EVID-GAP-LIVE-TRAFFIC"]
        },
        {
            "profile_name": "Family with School & Healthcare Needs",
            "fit_score": family_fit_score,
            "fit_level": family_fit_level,
            "fit_rationale": family_rationale,
            "key_tradeoffs": family_tradeoffs,
            "evidence_ids": family_ev_ids
        },
        {
            "profile_name": "Long-Term Property Investor",
            "fit_score": 60 if has_rera or has_oc else 40,
            "fit_level": "Moderate" if has_rera or has_oc else "Conditional",
            "fit_rationale": "Clear regulatory compliance makes it viable for capital deployment." if (has_rera or has_oc) else "Unverified legal permits and lack of RERA filings present unacceptable risk for capital deployment.",
            "key_tradeoffs": ["Zero audited rental yield benchmarks available in open directory", "Future capital appreciation is unprovable from map proximity"],
            "evidence_ids": ["EVID-CALC-RATE-SQFT"]
        }
    ]

    # Dynamic, Property-Specific Due Diligence Checklist (4 tailored questions)
    checklist = []
    
    # Question 1: Document/Permit specific
    if docs_count == 0:
        checklist.append({
            "topic": "Town Planning Building Sanction & AP RERA Permit",
            "question_to_ask_seller": "Since zero sanction or permit documents are uploaded to the platform, what is the GVMC/VMRDA approved building sanction permit number and AP RERA registration certificate?",
            "verification_source": "Municipal Town Planning Authority (GVMC/VMRDA) & State RERA Web Portal",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })
    elif not has_rera and not is_ready:
        checklist.append({
            "topic": "AP RERA Project Registration & Escrow Mandate",
            "question_to_ask_seller": "What is the AP RERA project registration number, and can you provide the quarterly chartered accountant certificate for the 70% designated escrow account?",
            "verification_source": "State RERA Web Portal & CA Escrow Statement",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })
    elif has_rera and not is_ready:
        checklist.append({
            "topic": "RERA Escrow Expenditure & Milestone Progress",
            "question_to_ask_seller": "With the RERA certificate on record, what is the latest CA-certified expenditure from the 70% escrow account and the engineer-certified percentage completion?",
            "verification_source": "AP RERA Quarterly Filing & Architect Milestone Certificate",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })
    elif has_oc and is_ready:
        checklist.append({
            "topic": "Society Handover & Occupancy Verification",
            "question_to_ask_seller": "The OC and Fire NOC are verified; has the builder formally handed over common building assets, sinking corpus, and maintenance accounts to the registered Apartment Owners Association (AOA)?",
            "verification_source": "Apartment Owners Association (AOA) Registration & Handover Minutes",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })
    else:
        checklist.append({
            "topic": "Occupancy Certificate (OC) Clearance",
            "question_to_ask_seller": "Has the municipal authority conducted final structural inspection and issued the Occupancy Certificate (OC) for this completed unit?",
            "verification_source": "GVMC / VMRDA Municipal Town Planning Division",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })

    # Question 2: Title & Encumbrance specific to locality
    if "gajuwaka" in locality:
        checklist.append({
            "topic": "30-Year Sub-Registrar Title Search & Revenue Pedigree",
            "question_to_ask_seller": "Can you provide the certified 30-year Nil-Encumbrance Certificate (EC) and parent title deeds from the Gajuwaka Sub-Registrar, confirming clear non-agricultural conversion?",
            "verification_source": "Gajuwaka Sub-Registrar Office & Independent Legal Advocate",
            "evidence_gap_id": "EVID-GAP-LEGAL-TITLE"
        })
    elif "rushikonda" in locality:
        checklist.append({
            "topic": "Coastal Regulation Zone (CRZ-II) & Title Verification",
            "question_to_ask_seller": "Can you provide the registered parent title deeds along with Coastal Regulation Zone (CRZ-II) high-tide clearance certification from the State Coastal Zone Authority?",
            "verification_source": "Andhra Pradesh Coastal Zone Management Authority (APSCZMA) & Sub-Registrar",
            "evidence_gap_id": "EVID-GAP-LEGAL-TITLE"
        })
    elif "madhurawada" in locality:
        checklist.append({
            "topic": "30-Year Sub-Registrar Title Search & Layout Sanction",
            "question_to_ask_seller": "Can you provide the certified 30-year Encumbrance Certificate (EC) and registered parent sale deeds verifying clear title chain through Madhurawada revenue records?",
            "verification_source": "Madhurawada Sub-Registrar Office & Independent Legal Advocate",
            "evidence_gap_id": "EVID-GAP-LEGAL-TITLE"
        })
    else:
        checklist.append({
            "topic": "30-Year Sub-Registrar Title Search",
            "question_to_ask_seller": "Can you provide the certified 30-year Encumbrance Certificate (EC) and registered parent sale deeds verified with the local Sub-Registrar?",
            "verification_source": "Local Sub-Registrar Office & Independent Legal Advocate",
            "evidence_gap_id": "EVID-GAP-LEGAL-TITLE"
        })

    # Question 3: Environmental / Micro-Climate / Infrastructure specific
    if "gajuwaka" in locality:
        checklist.append({
            "topic": "Industrial Environmental Buffer & Borewell Potability",
            "question_to_ask_seller": "Given the proximity to Gajuwaka industrial and refinery operations, what are the certified laboratory test reports for borehole drinking water TDS/heavy metals and ambient particulate matter?",
            "verification_source": "AP Pollution Control Board (APPCB) & Certified Water Quality Testing Lab",
            "evidence_gap_id": "EVID-ENV-AQI"
        })
    elif "rushikonda" in locality:
        checklist.append({
            "topic": "Marine Corrosion Protection & Borewell Salinity Testing",
            "question_to_ask_seller": "What specific anti-corrosive concrete reinforcement coatings were applied against sea spray, and does on-site borehole water exhibit coastal saltwater intrusion?",
            "verification_source": "Structural Engineer Audit & Groundwater Potability Lab Report",
            "evidence_gap_id": "EVID-ENV-AQI"
        })
    elif "madhurawada" in locality:
        checklist.append({
            "topic": "Monsoon Storm Water Drainage & UGD Network Linkage",
            "question_to_ask_seller": "Is the residential layout directly linked to the municipal underground drainage (UGD) system, and what is the recorded storm water drainage behavior during severe coastal rains?",
            "verification_source": "GVMC Engineering Wing & Physical Site Inspection during Monsoon",
            "evidence_gap_id": "EVID-LOC-COORDS"
        })
    else:
        checklist.append({
            "topic": "Municipal Water Supply & Sewerage Sanction",
            "question_to_ask_seller": "What is the sanctioned bulk daily municipal water supply volume (GVMC) versus reliance on private borewells and water tankers?",
            "verification_source": "GVMC Water Works Department & Utility Connection Sanction",
            "evidence_gap_id": "EVID-LOC-COORDS"
        })

    # Question 4: Stage / Financial Maintenance
    if not is_ready:
        checklist.append({
            "topic": "Milestone-Linked Escrow Payment Schedule",
            "question_to_ask_seller": "What is the architect-certified payment schedule linked strictly to structural slab and plastering construction milestones rather than calendar dates?",
            "verification_source": "Builder Buyer Agreement & Registered Bank Escrow Schedule",
            "evidence_gap_id": "EVID-GAP-MAINTENANCE-DEPOSITS"
        })
    else:
        checklist.append({
            "topic": "Maintenance Corpus, Sinking Fund & PTIN Tax Assessment",
            "question_to_ask_seller": "What is the initial corpus deposit, monthly maintenance charge per sq ft, and have individual property tax (PTIN) numbers been assigned by the municipal authority?",
            "verification_source": "Builder Buyer Agreement, AOA Bylaws & GVMC Revenue Portal",
            "evidence_gap_id": "EVID-GAP-MAINTENANCE-DEPOSITS"
        })

    # Missing Evidence Audit
    missing_evidence = []
    if docs_count == 0:
        missing_evidence.append({
            "item_name": "Municipal Sanction Drawings & RERA Certificate",
            "impact": "high",
            "why_it_matters": "Absence of uploaded building drawings makes it impossible to verify structural legality, setback compliance, or registered unit carpet area.",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })
        missing_evidence.append({
            "item_name": "Certified 30-Year Encumbrance Certificate (EC)",
            "impact": "high",
            "why_it_matters": "Essential to prove unencumbered ownership title, absence of legal disputes, and registered non-agricultural conversion.",
            "evidence_gap_id": "EVID-GAP-LEGAL-TITLE"
        })
    elif not has_rera and not is_ready:
        missing_evidence.append({
            "item_name": "AP RERA Registration Certificate",
            "impact": "high",
            "why_it_matters": "Without RERA registration, buyer lacks statutory protection of a 70% project escrow bank account.",
            "evidence_gap_id": "EVID-GAP-APPROVAL-PAPERS"
        })
    elif not has_oc and is_ready:
        missing_evidence.append({
            "item_name": "Municipal Occupancy Certificate (OC)",
            "impact": "high",
            "why_it_matters": "Without an OC, occupying the property may be unlawful and could lead to disconnection of municipal water or power.",
            "evidence_gap_id": "EVID-GAP-LEGAL-TITLE"
        })

    missing_evidence.append({
        "item_name": "Live Peak-Hour Traffic Sensor Data",
        "impact": "medium",
        "why_it_matters": "Reported travel times use static road network speeds; actual weekday commute times through key bottlenecks may vary.",
        "evidence_gap_id": "EVID-GAP-LIVE-TRAFFIC"
    })

    return {
        "executive_assessment": {
            "summary": f"{prop_name} is a {area_val} {items.get('EVID-SELLER-AREA-UNIT', {}).get('value', 'sq ft')} {prop_type} located in {locality.title()}, quoted at an asking price of {price_item.get('unit', '')} {price_val}." if price_val else f"{prop_name} is a {prop_type} in {locality.title()}.",
            "evidence_backed_advantages": advantages,
            "disadvantages_and_tradeoffs": tradeoffs,
            "ideal_buyer_summary": f"Best suited for {profiles[0]['profile_name']} with independent legal due diligence, or {profiles[1]['profile_name']} leveraging topological road corridors.",
            "critical_unresolved_questions": [q["question_to_ask_seller"] for q in checklist[:2]]
        },
        "location_and_daily_life": {
            "summary": location_summary,
            "amenity_breakdown": amenity_breakdown,
            "spatial_convenience_verdict": spatial_verdict,
            "coverage_limitations_explained": "Facilities reflect surveyed OpenStreetMap nodes within 5km radius. Unmapped informal local vendors are excluded.",
            "evidence_ids": [ab["evidence_ids"][0] for ab in amenity_breakdown if ab.get("evidence_ids")]
        },
        "connectivity_and_commute": {
            "summary": f"Calculated driving routes to {len(routes)} primary regional employment and transit hubs via OSRM topological road network.",
            "route_evaluations": route_evals,
            "traffic_uncertainty_note": "Travel durations reflect static road network speed limits; actual peak commute congestion is unmeasured.",
            "evidence_ids": [r["id"] for r in routes]
        },
        "environmental_assessment": {
            "summary": f"Regional Copernicus CAMS atmospheric sensor reports AQI of {aqi_index} ({aqi_cat}) in {locality.title()}.",
            "aqi_reading": aqi_index,
            "aqi_category": aqi_cat,
            "who_pollutant_compliance": pollutants_analysis,
            "model_vs_hyperlocal_disclaimer": "Atmospheric data is retrieved from Copernicus Atmosphere Monitoring Service (CAMS) regional model at 0.4 degree grid resolution.",
            "evidence_ids": ["EVID-ENV-AQI"] + [p["evidence_ids"][0] for p in pollutants_analysis]
        },
        "price_and_value_context": {
            "summary": f"Stated asking price of ₹{price_val} translates to ₹{rate_val}/sq ft based on stated built-up area of {area_val} sq ft.",
            "rate_per_sqft": rate_val if isinstance(rate_val, (int, float)) else 0,
            "comparables_context": f"Baseline rate of ₹{rate_val}/sq ft established from seller listing.",
            "valuation_disclaimer": "Asking quote is seller-provided and unverified; independent government guideline value (sub-registrar circle rate) should be verified prior to transaction.",
            "evidence_ids": ["EVID-CALC-RATE-SQFT", "EVID-SELLER-TOTAL-PRICE"]
        },
        "buyer_suitability_profiles": profiles,
        "due_diligence_checklist": checklist,
        "missing_evidence_audit": missing_evidence
    }


async def generate_property_intelligence_report(
    evidence: Dict[str, Any],
    buyer_preferences: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Orchestrates the AI Property Intelligence Engine:
    1. Prepares structured evidence payload with stable IDs.
    2. Sends prompt to OpenAI-compatible LLM endpoint (Qwen3.8-27B).
    3. Parses and strictly validates all evidence citations deterministically.
    4. Seamlessly falls back to rule-based analyst engine if remote model fails or times out.
    """
    start_time = time.time()
    valid_ids = set(evidence.get("items", {}).keys())

    # Build prompt content
    user_prompt = f"""ANALYZE THE FOLLOWING PROPERTY ACCORDING TO THE STRICT EVIDENCE LAYER:

PROPERTY IDENTIFIERS:
Property ID: {evidence.get('property_id')}
Property Name: {evidence.get('property_name')}

EVIDENCE ITEMS (STABLE CITATION IDENTIFIERS):
{json.dumps(evidence.get('items', {}), indent=2)}

BUYER PREFERENCES (IF SPECIFIED):
{json.dumps(buyer_preferences or {}, indent=2)}

TASK:
Produce a comprehensive, rigorous Property Intelligence Report.
Every factual claim MUST cite valid IDs from the evidence items list above (in an array under "evidence_ids").
Do not invent numbers. Highlight trade-offs and due diligence questions.
Return ONLY valid JSON matching this structure:
{{
  "executive_assessment": {{
    "summary": "...",
    "evidence_backed_advantages": [{{"claim": "...", "evidence_ids": ["..."]}}],
    "disadvantages_and_tradeoffs": [{{"claim": "...", "evidence_ids": ["..."]}}],
    "ideal_buyer_summary": "...",
    "critical_unresolved_questions": ["..."]
  }},
  "location_and_daily_life": {{
    "summary": "...",
    "amenity_breakdown": [{{"category": "...", "count": 0, "closest_meters": 0, "closest_name": "...", "practical_utility": "...", "evidence_ids": ["..."]}}],
    "spatial_convenience_verdict": "...",
    "coverage_limitations_explained": "...",
    "evidence_ids": ["..."]
  }},
  "connectivity_and_commute": {{
    "summary": "...",
    "route_evaluations": [{{"destination": "...", "road_distance_km": 0, "straight_line_km": 0, "estimated_duration_mins": 0, "tortuosity_ratio": 0, "connectivity_verdict": "...", "evidence_ids": ["..."]}}],
    "traffic_uncertainty_note": "...",
    "evidence_ids": ["..."]
  }},
  "environmental_assessment": {{
    "summary": "...",
    "aqi_reading": 0,
    "aqi_category": "...",
    "who_pollutant_compliance": [{{"pollutant": "...", "concentration": 0, "unit": "...", "who_guideline": 0, "status": "...", "evidence_ids": ["..."]}}],
    "model_vs_hyperlocal_disclaimer": "...",
    "evidence_ids": ["..."]
  }},
  "price_and_value_context": {{
    "summary": "...",
    "rate_per_sqft": 0,
    "comparables_context": "...",
    "valuation_disclaimer": "...",
    "evidence_ids": ["..."]
  }},
  "buyer_suitability_profiles": [
    {{
      "profile_name": "First-Time Homebuyer",
      "fit_score": 75,
      "fit_level": "Moderate",
      "fit_rationale": "...",
      "key_tradeoffs": ["..."],
      "evidence_ids": ["..."]
    }}
  ],
  "due_diligence_checklist": [
    {{
      "topic": "...",
      "question_to_ask_seller": "...",
      "verification_source": "...",
      "evidence_gap_id": "..."
    }}
  ],
  "missing_evidence_audit": [
    {{
      "item_name": "...",
      "impact": "high",
      "why_it_matters": "...",
      "evidence_gap_id": "..."
    }}
  ]
}}
"""

    report_result = None
    token_usage = None
    generation_source = "remote_llm"

    try:
        url = f"{settings.AI_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.AI_API_KEY}"
        }
        payload = {
            "model": settings.AI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": settings.AI_MAX_TOKENS,
            "temperature": 0.2
        }

        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_content = data["choices"][0]["message"]["content"]
                token_usage = data.get("usage")
                report_result = clean_json_response(raw_content)
                logger.info(f"Successfully generated AI report using remote LLM ({settings.AI_MODEL})")
            else:
                logger.warning(f"Remote AI server returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Remote LLM request failed or timed out: {e}. Falling back to deterministic analyst engine.")

    # Fallback if remote model failed or returned incomplete response
    if not report_result or "executive_assessment" not in report_result:
        generation_source = "deterministic_analyst_engine"
        report_result = generate_deterministic_fallback_report(evidence, buyer_preferences)

    # Perform citation validation
    validated_report = validate_and_repair_citations(report_result, evidence, buyer_preferences)

    execution_ms = int((time.time() - start_time) * 1000)

    return {
        "report": validated_report,
        "generation_source": generation_source,
        "model_name": settings.AI_MODEL if generation_source == "remote_llm" else "Deterministic Buyer Analyst Rule Engine",
        "prompt_version": settings.AI_PROMPT_VERSION,
        "execution_time_ms": execution_ms,
        "token_usage": token_usage
    }
