import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app import models

class EvidenceItem:
    def __init__(
        self,
        id: str,
        category: str,
        label: str,
        value: Any,
        unit: Optional[str] = None,
        provenance: str = "Retrieved Fact",
        retrieved_at: Optional[str] = None,
        limitations: Optional[str] = None,
        reliability: str = "moderate"
    ):
        self.id = id
        self.category = category # seller_fact, location_spatial, environmental, calculated, evidence_gap
        self.label = label
        self.value = value
        self.unit = unit
        self.provenance = provenance
        self.retrieved_at = retrieved_at or datetime.datetime.utcnow().isoformat()
        self.limitations = limitations
        self.reliability = reliability # high, moderate, unverified, gap

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "category": self.category,
            "label": self.label,
            "value": self.value,
            "unit": self.unit,
            "provenance": self.provenance,
            "retrieved_at": self.retrieved_at,
            "limitations": self.limitations,
            "reliability": self.reliability
        }


def build_property_evidence_layer(
    prop: models.Property,
    research: Optional[models.PropertyResearch],
    db: Optional[Session] = None,
    buyer_preferences: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Constructs a deterministic, structured evidence layer with stable IDs
    across 5 critical evidence groups (A to E).
    """
    evidence_items: Dict[str, Dict[str, Any]] = {}

    def add_item(item: EvidenceItem):
        evidence_items[item.id] = item.to_dict()

    # =========================================================================
    # GROUP A: SELLER-PROVIDED PROPERTY FACTS (Marked Unverified unless vetted)
    # =========================================================================
    add_item(EvidenceItem(
        id="EVID-SELLER-NAME",
        category="seller_fact",
        label="Project / Property Name",
        value=prop.name,
        provenance="Seller provided / Unverified",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-TYPE",
        category="seller_fact",
        label="Property Type",
        value=prop.property_type,
        provenance="Seller provided / Unverified",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-PRICE-TEXT",
        category="seller_fact",
        label="Stated Asking Price",
        value=prop.asking_price,
        unit="INR",
        provenance="Seller provided / Unverified",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-TOTAL-PRICE",
        category="seller_fact",
        label="Total Normalized Price",
        value=prop.total_price or 0.0,
        unit="INR",
        provenance="Seller provided / Unverified",
        limitations="Seller self-reported asking quote; excludes statutory registration, stamp duty and GST unless specified.",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-AREA",
        category="seller_fact",
        label="Built-up / Plot Area",
        value=prop.area,
        unit=prop.area_unit or "sq ft",
        provenance="Seller provided / Unverified",
        limitations="Self-reported area. Carpet area vs super built-up ratio not independently audited.",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-LOCALITY",
        category="seller_fact",
        label="Locality & City",
        value=f"{prop.locality}, {prop.city}",
        provenance="Seller provided / Unverified",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-ADDRESS",
        category="seller_fact",
        label="Stated Physical Address",
        value=prop.address,
        provenance="Seller provided / Unverified",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-CONSTRUCTION",
        category="seller_fact",
        label="Construction Status",
        value=prop.construction_status,
        provenance="Seller provided / Unverified",
        limitations="RERA milestone audit not attached.",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-AMENITIES",
        category="seller_fact",
        label="Seller-Claimed Amenities",
        value=prop.amenities or [],
        provenance="Seller provided / Unverified",
        limitations="Facilities promised by developer; operational status requires on-site inspection.",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-UTILITIES",
        category="seller_fact",
        label="Stated Utilities & Infrastructure",
        value=prop.utilities or [],
        provenance="Seller provided / Unverified",
        reliability="unverified"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-ROAD-ACCESS",
        category="seller_fact",
        label="Stated Road Access Width",
        value=prop.road_access_m,
        unit="meters",
        provenance="Seller provided / Unverified",
        limitations="Subject to municipal town planning masterplan verification.",
        reliability="unverified"
    ))

    docs_raw = prop.documents or []
    if isinstance(docs_raw, str):
        try:
            import json as _json
            docs_list = _json.loads(docs_raw)
        except Exception:
            docs_list = []
    elif isinstance(docs_raw, list):
        docs_list = docs_raw
    else:
        docs_list = []

    doc_names = [d.get("name", "") if isinstance(d, dict) else str(d) for d in docs_list]
    has_rera = any("rera" in n.lower() for n in doc_names)
    has_oc = any("occupancy" in n.lower() or "oc" in n.lower().split() for n in doc_names)
    has_sanction = any("sanction" in n.lower() or "plan" in n.lower() for n in doc_names)
    has_fire = any("fire" in n.lower() for n in doc_names)
    has_brochure = any("brochure" in n.lower() for n in doc_names)

    add_item(EvidenceItem(
        id="EVID-SELLER-DOCS-COUNT",
        category="seller_fact",
        label="Seller Uploaded Legal Deeds",
        value=len(docs_list),
        provenance="Seller provided / Unverified",
        limitations="Documents uploaded by builder; does not constitute encumbrance certificate title clearance.",
        reliability="high" if len(docs_list) > 0 else "gap"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-DOCS-LIST",
        category="seller_fact",
        label="Uploaded Documents Details",
        value={
            "count": len(docs_list),
            "documents": docs_list,
            "doc_names": doc_names,
            "has_rera": has_rera,
            "has_oc": has_oc,
            "has_sanction_plan": has_sanction,
            "has_fire_noc": has_fire,
            "has_brochure": has_brochure
        },
        provenance="Seller Document Repository",
        reliability="high" if len(docs_list) > 0 else "gap"
    ))

    add_item(EvidenceItem(
        id="EVID-SELLER-CONSTRUCTION-STATUS",
        category="seller_fact",
        label="Construction Status",
        value=prop.construction_status or "Under Construction",
        provenance="Seller Stated",
        reliability="moderate"
    ))

    # =========================================================================
    # GROUP B: LOCATION & SPATIAL EVIDENCE (OpenStreetMap, Overpass, OSRM)
    # =========================================================================
    add_item(EvidenceItem(
        id="EVID-LOC-COORDS",
        category="location_spatial",
        label="Cadastral Stored GPS Coordinates",
        value={"lat": prop.latitude, "lon": prop.longitude},
        provenance="Leaflet Coordinate Pin / Seller Placed",
        reliability="high"
    ))

    # Reverse Geocoding
    geo_data = research.geocoding_data if research else None
    if geo_data:
        add_item(EvidenceItem(
            id="EVID-LOC-GEOCODED-ADDR",
            category="location_spatial",
            label="OpenStreetMap Reverse Geocoded Address",
            value=geo_data.get("display_name", prop.address),
            provenance="OpenStreetMap Nominatim (ODbL)",
            retrieved_at=research.last_researched_at.isoformat() if research and research.last_researched_at else None,
            reliability="high"
        ))

    # Nearby POIs by Category
    overpass_available = (
        research is not None and
        research.nearby_pois is not None and
        (research.poi_summary or {}).get("status") != "unavailable"
    )
    pois_by_cat = (research.nearby_pois if (research and overpass_available) else None) or {}
    poi_summary = (research.poi_summary if (research and overpass_available) else None) or {}

    category_map = {
        "Public Transport": ("EVID-LOC-POI-TRANSPORT", "Public Transit Hubs (Metro, Rail, Bus)"),
        "Education": ("EVID-LOC-POI-EDUCATION", "Education Facilities (Schools, Colleges)"),
        "Healthcare": ("EVID-LOC-POI-HEALTHCARE", "Healthcare (Hospitals, Clinics, Pharmacies)"),
        "Daily Needs": ("EVID-LOC-POI-DAILYNEEDS", "Daily Needs (Supermarkets, Groceries, Markets)"),
        "Lifestyle & Recreation": ("EVID-LOC-POI-LIFESTYLE", "Lifestyle & Recreation (Parks, Dining, Fitness)"),
        "Public Services": ("EVID-LOC-POI-PUBLICSERVICES", "Public Services (Banks, ATMs, Civic Services)")
    }

    if not overpass_available:
        for cat_name, (ev_id, ev_label) in category_map.items():
            add_item(EvidenceItem(
                id=ev_id,
                category="location_spatial",
                label=ev_label,
                value={
                    "status": "unavailable",
                    "count": None,
                    "message": "Nearby POI discovery unavailable: OpenStreetMap Overpass provider error or not yet executed."
                },
                provenance="OpenStreetMap Overpass API (Provider Unavailable)",
                retrieved_at=research.last_researched_at.isoformat() if research and research.last_researched_at else None,
                limitations="Spatial search could not be completed; cannot confirm presence or absence of facilities.",
                reliability="gap"
            ))
    else:
        for cat_name, (ev_id, ev_label) in category_map.items():
            cat_pois = pois_by_cat.get(cat_name, [])
            cat_sum = poi_summary.get(cat_name, {})
            has_facilities = len(cat_pois) > 0 and bool(cat_sum.get("closest_name"))
            add_item(EvidenceItem(
                id=ev_id,
                category="location_spatial",
                label=ev_label,
                value={
                    "status": "available" if has_facilities else "none_found",
                    "count": len(cat_pois),
                    "closest_meters": cat_sum.get("closest_meters") if has_facilities else None,
                    "closest_name": cat_sum.get("closest_name") if has_facilities else None,
                    "sample_facilities": [
                        {"name": p["name"], "distance_meters": p["distance_meters"], "type": p["type"]}
                        for p in cat_pois[:5]
                    ] if has_facilities else []
                },
                provenance="OpenStreetMap Overpass API (Spatial Discovery within 5km)",
                retrieved_at=research.last_researched_at.isoformat() if research and research.last_researched_at else None,
                limitations="Based on community OpenStreetMap mapping; absence on map does not prove non-existence in reality.",
                reliability="high" if has_facilities else "gap"
            ))

    # Connectivity & Road Routing (OSRM)
    connectivity = (research.connectivity_data if research else None) or {}
    routes = connectivity.get("routes", [])

    for idx, r in enumerate(routes):
        r_name = r.get("name", f"Destination {idx+1}")
        clean_key = r_name.replace(" ", "_").replace("(", "").replace(")", "").upper()
        route_id = f"EVID-ROUTE-{clean_key[:12]}"

        add_item(EvidenceItem(
            id=route_id,
            category="location_spatial",
            label=f"Road Route to {r_name}",
            value={
                "destination": r_name,
                "type": r.get("type", "Transit Hub"),
                "road_distance_km": r.get("road_distance_km"),
                "straight_line_distance_km": r.get("straight_line_distance_km"),
                "estimated_duration_mins": r.get("estimated_duration_mins"),
                "tortuosity_ratio": r.get("tortuosity_ratio")
            },
            unit="km / mins",
            provenance="OSRM Road Routing Engine (Topological vehicular driving network)",
            limitations="Calculated based on standard road network speed limits; DOES NOT include live traffic congestion.",
            reliability="high"
        ))

    # =========================================================================
    # GROUP C: ENVIRONMENTAL EVIDENCE (Copernicus CAMS & Open-Meteo)
    # =========================================================================
    aq_data = research.air_quality_data if research else None
    if aq_data and aq_data.get("status") == "available":
        add_item(EvidenceItem(
            id="EVID-ENV-AQI",
            category="environmental",
            label="US EPA Air Quality Index (AQI)",
            value={
                "index_value": aq_data.get("us_aqi"),
                "category": aq_data.get("category"),
                "health_advice": aq_data.get("health_advice"),
                "scale": "US EPA 2024 Standard (0-500 scale)"
            },
            provenance="Copernicus CAMS European Atmospheric Reanalysis & Open-Meteo",
            retrieved_at=aq_data.get("retrieved_at"),
            limitations="Represents ~11km regional grid cell reanalysis. Does not reflect hyperlocal indoor or curb microclimates.",
            reliability="high"
        ))

        # Individual Pollutants vs WHO Guidelines
        pollutants_list = aq_data.get("pollutants")
        if not pollutants_list:
            # Robust fallback for flat schema
            flat_specs = [
                ("PM2_5", "PM2.5 (Fine Particles)", aq_data.get("pm2_5"), 15.0),
                ("PM10", "PM10 (Inhalable Particles)", aq_data.get("pm10"), 45.0),
                ("NO2", "Nitrogen Dioxide (NO₂)", aq_data.get("nitrogen_dioxide"), 25.0),
                ("SO2", "Sulphur Dioxide (SO₂)", aq_data.get("sulphur_dioxide"), 40.0),
                ("O3", "Surface Ozone (O₃)", aq_data.get("ozone"), 100.0),
                ("CO", "Carbon Monoxide (CO)", aq_data.get("carbon_monoxide"), 4000.0),
            ]
            pollutants_list = [
                {
                    "code": code.lower(),
                    "label": label,
                    "value": val,
                    "unit": "µg/m³",
                    "who_guideline": who,
                    "status": "Safe" if (val or 0) <= who else "Elevated",
                    "percentage_of_limit": min(100, int(((val or 0) / (who * 2.0)) * 100)) if val is not None else 0
                }
                for code, label, val, who in flat_specs
                if val is not None
            ]

        for p in pollutants_list:
            p_code = p.get("code", "").upper()
            add_item(EvidenceItem(
                id=f"EVID-ENV-POLLUTANT-{p_code}",
                category="environmental",
                label=f"{p.get('label')} Concentration",
                value={
                    "concentration": p.get("value"),
                    "who_24h_guideline": p.get("who_guideline"),
                    "status_vs_who": p.get("status"),
                    "percentage_of_limit": p.get("percentage_of_limit")
                },
                unit=p.get("unit", "µg/m³"),
                provenance="Copernicus CAMS / Open-Meteo Satellite Atmospheric Model",
                retrieved_at=aq_data.get("retrieved_at"),
                limitations="Hourly atmospheric grid model nowcast (units in µg/m³) compared to WHO 2021 24h baseline guidance.",
                reliability="high"
            ))
    else:
        add_item(EvidenceItem(
            id="EVID-ENV-AQI",
            category="environmental",
            label="Air Quality Observations",
            value="Data Unavailable for this coordinate",
            provenance="Open-Meteo Air Quality",
            limitations="Atmospheric data could not be retrieved from satellite/ground stations for this location.",
            reliability="gap"
        ))

    # =========================================================================
    # GROUP D: SYSTEM-CALCULATED EVIDENCE
    # =========================================================================
    # 1. Price Per Unit Area
    if (prop.total_price or 0) > 0 and (prop.area or 0) > 0:
        rate_per_sqft = round((prop.total_price or 0) / (prop.area or 1.0), 2)
        add_item(EvidenceItem(
            id="EVID-CALC-RATE-SQFT",
            category="calculated",
            label="Calculated Asking Rate per Square Foot",
            value=rate_per_sqft,
            unit="INR / sq ft",
            provenance="System Calculated: (total_price / area in sq ft)",
            limitations="Based entirely on seller asking price; excludes stamp duty, registration, parking and amenity premiums.",
            reliability="high"
        ))
    else:
        add_item(EvidenceItem(
            id="EVID-CALC-RATE-SQFT",
            category="calculated",
            label="Calculated Asking Rate per Square Foot",
            value="Incalculable: total price or area is unstated/zero",
            provenance="System Calculated",
            reliability="gap"
        ))

    # 2. Total Nearby POI Count within 5km
    total_pois = sum(len(pois) for pois in pois_by_cat.values())
    add_item(EvidenceItem(
        id="EVID-CALC-TOTAL-POIS",
        category="calculated",
        label="Total Amenities Mapped within 5km Radius",
        value=total_pois,
        unit="facilities",
        provenance="System Aggregation of OpenStreetMap Discovery",
        limitations="Reflects OpenStreetMap density; urban density affects mapping coverage.",
        reliability="moderate"
    ))

    # 3. Market Pricing Context (Comparable Listings in same locality)
    if db:
        try:
            comparables = db.query(models.Property).filter(
                models.Property.locality == prop.locality,
                models.Property.status == "published",
                models.Property.id != prop.id
            ).all()

            if comparables:
                valid_rates = [
                    (c.total_price / c.area) for c in comparables
                    if (c.total_price or 0) > 0 and (c.area or 0) > 0 and c.area_unit == prop.area_unit
                ]
                if valid_rates:
                    avg_locality_rate = round(sum(valid_rates) / len(valid_rates), 2)
                    add_item(EvidenceItem(
                        id="EVID-CALC-LOCALITY-AVG-RATE",
                        category="calculated",
                        label=f"Locality ({prop.locality}) Average Asking Rate",
                        value={
                            "average_rate": avg_locality_rate,
                            "comparables_count": len(valid_rates),
                            "range_min": round(min(valid_rates), 2),
                            "range_max": round(max(valid_rates), 2)
                        },
                        unit=f"INR / {prop.area_unit}",
                        provenance="Directory Published Listings Aggregation",
                        limitations="Based on current asking quotes of published directory listings, NOT registered transaction registry deeds.",
                        reliability="moderate"
                    ))
        except Exception:
            pass

    # =========================================================================
    # GROUP E: MISSING EVIDENCE, UNCERTAINTIES & DUE-DILIGENCE GAPS
    # =========================================================================
    add_item(EvidenceItem(
        id="EVID-GAP-LEGAL-TITLE",
        category="evidence_gap",
        label="Independent Legal Title & Encumbrance Vetting",
        value="Unverified",
        provenance="Evidence Gap Audit",
        limitations="No government land revenue (Meebhoomi / Sub-Registrar) 30-year Encumbrance Certificate or title search report attached.",
        reliability="gap"
    ))

    add_item(EvidenceItem(
        id="EVID-GAP-LIVE-TRAFFIC",
        category="evidence_gap",
        label="Peak-Hour Traffic Congestion Observations",
        value="Unmeasured",
        provenance="Evidence Gap Audit",
        limitations="OSRM route duration reflects free-flow speed limits on highway graph. Peak commute congestion remains unknown.",
        reliability="gap"
    ))

    add_item(EvidenceItem(
        id="EVID-GAP-MAINTENANCE-DEPOSITS",
        category="evidence_gap",
        label="Long-Term Maintenance & Sinking Fund Disclosures",
        value="Incomplete",
        provenance="Evidence Gap Audit",
        limitations="Recurring sinking fund, clubhouse maintenance corpus, and municipal property tax estimates are not specified.",
        reliability="gap"
    ))

    if not prop.documents:
        add_item(EvidenceItem(
            id="EVID-GAP-APPROVAL-PAPERS",
            category="evidence_gap",
            label="Municipal & RERA Sanction Documents",
            value="Missing from Listing",
            provenance="Evidence Gap Audit",
            limitations="Seller has not attached town planning sanction drawings, building permits, or commencement certificate.",
            reliability="gap"
        ))

    if total_pois == 0:
        add_item(EvidenceItem(
            id="EVID-GAP-UNSURVEYED-POIS",
            category="evidence_gap",
            label="Community Amenity Mapping Coverage",
            value="Zero Mapped Facilities in 5km",
            provenance="OpenStreetMap Discovery Audit",
            limitations="Zero facilities found within 5km radius. Either the area is newly developing or OpenStreetMap community contributors have not mapped local amenities.",
            reliability="gap"
        ))

    return {
        "property_id": prop.id,
        "property_name": prop.name,
        "research_status": research.status if research else "unresearched",
        "evidence_count": len(evidence_items),
        "as_of_timestamp": datetime.datetime.utcnow().isoformat(),
        "items": evidence_items
    }
