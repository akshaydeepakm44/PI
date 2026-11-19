import pytest
import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, Property, PropertyResearch, PropertyIntelligenceReport
from app.auth import hash_password
from app.services.evidence import build_property_evidence_layer
from app.services.ai_analyst import (
    validate_and_repair_citations,
    generate_deterministic_fallback_report,
    generate_property_intelligence_report
)
from app.services.comparator import compare_properties_evidence

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hi_in.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 30.0})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

MOCK_AIR_QUALITY_DATA = {
    "status": "available",
    "provider": "Open-Meteo Air Quality (Copernicus CAMS & ground calibrated)",
    "observation_time": "2026-10-22T03:00",
    "retrieved_at": "2026-10-22T03:45:00Z",
    "location": {"latitude": 17.784, "longitude": 83.376, "elevation_meters": 12},
    "us_aqi": 74,
    "european_aqi": 42,
    "category": "Moderate",
    "color_theme": "amber",
    "health_advice": "Acceptable air quality; sensitive individuals may experience minor irritation.",
    "pollutants": [
        {"code": "pm2_5", "label": "PM2.5 (Fine Particles)", "value": 23.1, "unit": "µg/m³", "who_guideline": 15.0, "status": "Moderate", "color": "amber", "percentage_of_limit": 30},
        {"code": "pm10", "label": "PM10 (Inhalable Particles)", "value": 46.5, "unit": "µg/m³", "who_guideline": 45.0, "status": "Moderate", "color": "amber", "percentage_of_limit": 31},
        {"code": "no2", "label": "Nitrogen Dioxide (NO₂)", "value": 18.2, "unit": "µg/m³", "who_guideline": 25.0, "status": "Safe", "color": "emerald", "percentage_of_limit": 36},
        {"code": "so2", "label": "Sulphur Dioxide (SO₂)", "value": 8.1, "unit": "µg/m³", "who_guideline": 40.0, "status": "Safe", "color": "emerald", "percentage_of_limit": 10},
        {"code": "o3", "label": "Surface Ozone (O₃)", "value": 35.0, "unit": "µg/m³", "who_guideline": 100.0, "status": "Safe", "color": "emerald", "percentage_of_limit": 19},
        {"code": "co", "label": "Carbon Monoxide (CO)", "value": 450.0, "unit": "µg/m³", "who_guideline": 4000.0, "status": "Safe", "color": "emerald", "percentage_of_limit": 11}
    ]
}

MOCK_POI_DATA = {
    "Public Transport": [
        {"id": 101, "name": "Rushikonda Bus Stop", "category": "Public Transport", "type": "bus_stop", "latitude": 17.785, "longitude": 83.377, "distance_meters": 180, "distance_km": 0.18, "distance_tier": "under_1km"}
    ],
    "Education": [
        {"id": 201, "name": "GITAM Deemed University", "category": "Education", "type": "university", "latitude": 17.782, "longitude": 83.379, "distance_meters": 620, "distance_km": 0.62, "distance_tier": "under_1km"}
    ],
    "Healthcare": [
        {"id": 301, "name": "Rushikonda Primary Health Centre", "category": "Healthcare", "type": "clinic", "latitude": 17.789, "longitude": 83.372, "distance_meters": 950, "distance_km": 0.95, "distance_tier": "under_1km"}
    ],
    "Daily Needs": [
        {"id": 401, "name": "Beach Road Supermarket", "category": "Daily Needs", "type": "supermarket", "latitude": 17.783, "longitude": 83.375, "distance_meters": 220, "distance_km": 0.22, "distance_tier": "under_1km"}
    ]
}

MOCK_CONNECTIVITY_DATA = {
    "routes": [
        {
            "name": "Visakhapatnam Railway Station",
            "type": "Intercity Railway Terminal",
            "road_distance_km": 14.5,
            "straight_line_distance_km": 11.2,
            "estimated_duration_mins": 28,
            "tortuosity_ratio": 1.29,
            "route_geometry": [[83.376, 17.784], [83.296, 17.721]]
        },
        {
            "name": "Rushikonda IT SEZ (Tech Park)",
            "type": "IT Employment Hub",
            "road_distance_km": 4.69,
            "straight_line_distance_km": 3.82,
            "estimated_duration_mins": 9,
            "tortuosity_ratio": 1.23,
            "route_geometry": [[83.376, 17.784], [83.385, 17.818]]
        }
    ]
}

@pytest.fixture(scope="module", autouse=True)
def setup_phase3_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Pre-seed users
    user = db.query(User).filter(User.email == "buyer3@hi-in.demo").first()
    if not user:
        user = User(
            email="buyer3@hi-in.demo",
            hashed_password=hash_password("password123"),
            full_name="Phase 3 Buyer",
            role="buyer"
        )
        db.add(user)
        db.commit()

    seller = db.query(User).filter(User.email == "seller3@hi-in.demo").first()
    if not seller:
        seller = User(
            email="seller3@hi-in.demo",
            hashed_password=hash_password("password123"),
            full_name="Phase 3 Seller",
            role="seller"
        )
        db.add(seller)
        db.commit()

    # Seed property 1
    p1 = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    if not p1:
        p1 = Property(
            seller_id=seller.id,
            name="Seaside Pearl Residences",
            property_type="apartment",
            locality="Rushikonda",
            address="Beach Road, Rushikonda",
            latitude=17.784,
            longitude=83.376,
            area=1600.0,
            area_unit="sq ft",
            asking_price="₹80 Lakhs",
            total_price=8000000.0,
            description="Luxury 3BHK flat near beachfront.",
            amenities=["Covered Parking", "Clubhouse", "24/7 Security"],
            utilities=["Municipal Water", "Power Backup"],
            construction_status="Ready to Move",
            seller_name="Pearl Developers",
            seller_contact="contact@pearl.demo",
            status="published"
        )
        db.add(p1)
        db.commit()
        db.refresh(p1)

    # Seed property 2 for comparison
    p2 = db.query(Property).filter(Property.name == "Hillside Crest Villa").first()
    if not p2:
        p2 = Property(
            seller_id=seller.id,
            name="Hillside Crest Villa",
            property_type="villa",
            locality="Madhurawada",
            address="IT SEZ Road, Madhurawada",
            latitude=17.818,
            longitude=83.385,
            area=2400.0,
            area_unit="sq ft",
            asking_price="₹1.50 Crore",
            total_price=15000000.0,
            description="Contemporary 4BHK gated villa near IT park.",
            amenities=["Private Garden", "Solar Water"],
            utilities=["Borewell Water"],
            construction_status="Ready to Move",
            seller_name="Crest Living",
            seller_contact="contact@crest.demo",
            status="published"
        )
        db.add(p2)
        db.commit()
        db.refresh(p2)

    # Reset p1 coordinates in case a previous test mutated them
    p1.latitude = 17.784
    p1.longitude = 83.376
    db.commit()

    # Attach or reset research to p1
    r1 = db.query(PropertyResearch).filter(PropertyResearch.property_id == p1.id).first()
    if not r1:
        r1 = PropertyResearch(
            property_id=p1.id,
            status="completed",
            geocoding_data={"display_name": "Beach Road, Rushikonda, Visakhapatnam"},
            nearby_pois=MOCK_POI_DATA,
            poi_summary={"Education": {"total": 1, "closest_meters": 620, "closest_name": "GITAM Deemed University"}},
            air_quality_data=MOCK_AIR_QUALITY_DATA,
            connectivity_data=MOCK_CONNECTIVITY_DATA,
            source_metadata={"execution_time_ms": 120, "pipeline_version": "2.0-verified-real"}
        )
        db.add(r1)
    else:
        r1.status = "completed"
        r1.nearby_pois = MOCK_POI_DATA
        r1.poi_summary = {"Education": {"total": 1, "closest_meters": 620, "closest_name": "GITAM Deemed University"}}
        r1.air_quality_data = MOCK_AIR_QUALITY_DATA
        r1.connectivity_data = MOCK_CONNECTIVITY_DATA
    db.commit()

    # Attach or reset research to p2
    r2 = db.query(PropertyResearch).filter(PropertyResearch.property_id == p2.id).first()
    if not r2:
        r2 = PropertyResearch(
            property_id=p2.id,
            status="completed",
            geocoding_data={"display_name": "IT SEZ Road, Madhurawada, Visakhapatnam"},
            nearby_pois=MOCK_POI_DATA,
            poi_summary={"Education": {"total": 1, "closest_meters": 800, "closest_name": "GITAM Deemed University"}},
            air_quality_data=MOCK_AIR_QUALITY_DATA,
            connectivity_data=MOCK_CONNECTIVITY_DATA,
            source_metadata={"execution_time_ms": 115, "pipeline_version": "2.0-verified-real"}
        )
        db.add(r2)
    else:
        r2.status = "completed"
        r2.nearby_pois = MOCK_POI_DATA
        r2.poi_summary = {"Education": {"total": 1, "closest_meters": 800, "closest_name": "GITAM Deemed University"}}
        r2.air_quality_data = MOCK_AIR_QUALITY_DATA
        r2.connectivity_data = MOCK_CONNECTIVITY_DATA
    db.commit()

    db.close()


def test_evidence_layer_structure():
    """Verify structured evidence layer produces stable IDs across Groups A to E."""
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    research = db.query(PropertyResearch).filter(PropertyResearch.property_id == prop.id).first()
    
    evidence = build_property_evidence_layer(prop, research, db)
    db.close()

    items = evidence["items"]
    assert len(items) >= 10
    
    # Group A: Seller facts
    assert "EVID-SELLER-TOTAL-PRICE" in items
    assert items["EVID-SELLER-TOTAL-PRICE"]["category"] == "seller_fact"
    assert items["EVID-SELLER-TOTAL-PRICE"]["provenance"] == "Seller provided / Unverified"
    assert items["EVID-SELLER-TOTAL-PRICE"]["value"] == 8000000.0

    # Group B: Location evidence
    assert "EVID-LOC-COORDS" in items
    assert "EVID-LOC-POI-EDUCATION" in items
    assert "EVID-ROUTE-VISAKHAPATNA" in items or any(k.startswith("EVID-ROUTE-") for k in items)

    # Group C: Environmental evidence
    assert "EVID-ENV-AQI" in items
    assert items["EVID-ENV-AQI"]["value"]["index_value"] == 74
    assert items["EVID-ENV-AQI"]["value"]["scale"] == "US EPA 2024 Standard (0-500 scale)"
    assert "EVID-ENV-POLLUTANT-PM2_5" in items
    assert items["EVID-ENV-POLLUTANT-PM2_5"]["unit"] == "µg/m³"

    # Group D: Calculated evidence
    assert "EVID-CALC-RATE-SQFT" in items
    # 8000000 / 1600 = 5000.0 INR/sq ft
    assert items["EVID-CALC-RATE-SQFT"]["value"] == 5000.0
    assert items["EVID-CALC-RATE-SQFT"]["unit"] == "INR / sq ft"

    # Group E: Gaps & Uncertainties
    assert "EVID-GAP-LEGAL-TITLE" in items
    assert "EVID-GAP-LIVE-TRAFFIC" in items
    assert items["EVID-GAP-LEGAL-TITLE"]["reliability"] == "gap"


def test_citation_validation_and_pruning():
    """Verify deterministic validator prunes hallucinated citation IDs and checks numerical values."""
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    research = db.query(PropertyResearch).filter(PropertyResearch.property_id == prop.id).first()
    evidence = build_property_evidence_layer(prop, research, db)
    db.close()

    fake_report = {
        "executive_assessment": {
            "summary": "Sample report",
            "evidence_backed_advantages": [
                {
                    "claim": "Close to IT park with validated road distance",
                    "evidence_ids": ["EVID-ENV-AQI", "EVID-HALLUCINATED-999"]
                }
            ],
            "disadvantages_and_tradeoffs": []
        },
        "environmental_assessment": {
            "aqi_reading": 999, # Fabricated number
            "aqi_category": "Good",
            "who_pollutant_compliance": []
        },
        "price_and_value_context": {
            "rate_per_sqft": 12000.0 # Fabricated rate
        }
    }

    validated = validate_and_repair_citations(fake_report, evidence)

    # 1. Hallucinated ID must be pruned
    adv_ids = validated["executive_assessment"]["evidence_backed_advantages"][0]["evidence_ids"]
    assert "EVID-HALLUCINATED-999" not in adv_ids
    assert "EVID-ENV-AQI" in adv_ids

    # 2. Fabricated AQI reading must be repaired to true evidence reading (74)
    assert validated["environmental_assessment"]["aqi_reading"] == 74
    assert validated["environmental_assessment"]["aqi_category"] == "Moderate"

    # 3. Fabricated rate/sqft must be repaired to calculated 5000.0
    assert validated["price_and_value_context"]["rate_per_sqft"] == 5000.0

    # 4. Audit block must track validations
    audit = validated["evidence_citations_audit"]
    assert audit["hallucinated_citations_pruned"] == 1
    assert audit["numerical_corrections_made"] >= 2


def test_generate_ai_report_deterministic():
    """Verify deterministic fallback analyst produces complete, valid structured report."""
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    research = db.query(PropertyResearch).filter(PropertyResearch.property_id == prop.id).first()
    evidence = build_property_evidence_layer(prop, research, db)
    db.close()

    report = generate_deterministic_fallback_report(evidence)
    
    assert "executive_assessment" in report
    assert len(report["executive_assessment"]["evidence_backed_advantages"]) >= 1
    assert len(report["executive_assessment"]["disadvantages_and_tradeoffs"]) >= 1
    assert "buyer_suitability_profiles" in report
    assert len(report["buyer_suitability_profiles"]) >= 3
    assert "due_diligence_checklist" in report
    assert len(report["due_diligence_checklist"]) >= 3
    assert "missing_evidence_audit" in report


def test_buyer_personalization_impact():
    """Verify suitability evaluation and decision aid score change dynamically when buyer preferences change."""
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    research = db.query(PropertyResearch).filter(PropertyResearch.property_id == prop.id).first()
    evidence = build_property_evidence_layer(prop, research, db)
    db.close()

    # Preference A: Generous budget (1 Crore), prioritizing transit
    prefs_a = {
        "budget_max": 10000000.0,
        "intended_use": "self_occupation",
        "priorities": {"schools": 2, "transit": 5, "air_quality": 3}
    }
    report_a = generate_deterministic_fallback_report(evidence, prefs_a)
    validated_a = validate_and_repair_citations(report_a, evidence, prefs_a)
    pers_a = validated_a["personalized_buyer_assessment"]
    assert "Below buyer ceiling" in pers_a["budget_evaluation"] or "within target budget" in pers_a["budget_evaluation"].lower()

    # Preference B: Tight budget (60 Lakhs, property is 80 Lakhs)
    prefs_b = {
        "budget_max": 6000000.0,
        "intended_use": "self_occupation",
        "priorities": {"schools": 5, "transit": 1, "air_quality": 5}
    }
    report_b = generate_deterministic_fallback_report(evidence, prefs_b)
    validated_b = validate_and_repair_citations(report_b, evidence, prefs_b)
    pers_b = validated_b["personalized_buyer_assessment"]
    assert "exceeds" in pers_b["budget_evaluation"].lower()
    
    # Tight budget must reflect lower decision aid score
    assert pers_b["decision_aid_score"] < pers_a["decision_aid_score"]


async def mock_ai_report_call(evidence_layer, buyer_prefs=None):
    rep = generate_deterministic_fallback_report(evidence_layer, buyer_prefs)
    val = validate_and_repair_citations(rep, evidence_layer, buyer_prefs)
    return {
        "report": val,
        "generation_source": "mocked_automated_test_model",
        "model_name": "mock-llm-v3",
        "prompt_version": "v3.0.0-buyer-analyst",
        "execution_time_ms": 35,
        "token_usage": {"prompt_tokens": 150, "completion_tokens": 400, "total_tokens": 550}
    }


def test_ai_report_api_endpoints():
    """Test GET and POST report endpoints return validated JSON schema using mocked model for deterministic execution."""
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    prop_id = prop.id
    db.close()

    with patch("app.routers.intelligence.generate_property_intelligence_report", side_effect=mock_ai_report_call):
        # 1. GET /intelligence/properties/{id}/evidence
        ev_res = client.get(f"/api/intelligence/properties/{prop_id}/evidence")
        assert ev_res.status_code == 200
        ev_data = ev_res.json()
        assert "items" in ev_data
        assert "EVID-SELLER-TOTAL-PRICE" in ev_data["items"]

        # 2. GET /intelligence/properties/{id}/report
        res = client.get(f"/api/intelligence/properties/{prop_id}/report")
        assert res.status_code == 200
        data = res.json()
        assert data["property_id"] == prop_id
        assert "report" in data
        assert "executive_assessment" in data["report"]
        assert data["status"] == "completed"

        # 3. POST /intelligence/properties/{id}/report/generate with buyer preferences
        gen_payload = {
            "buyer_preferences": {
                "budget_max": 9000000.0,
                "intended_use": "family_home",
                "commute_tolerance_mins": 35,
                "priorities": {"schools": 5, "transit": 4, "air_quality": 4}
            },
            "force_refresh": True
        }
        gen_res = client.post(f"/api/intelligence/properties/{prop_id}/report/generate", json=gen_payload)
        assert gen_res.status_code == 200
        gen_data = gen_res.json()
        assert gen_data["property_id"] == prop_id
        assert "personalized_buyer_assessment" in gen_data["report"]
        assert gen_data["report"]["personalized_buyer_assessment"]["decision_aid_score"] >= 50


def test_stale_report_invalidation_on_coordinate_change():
    """Test that modifying property coordinates marks previous reports as stale."""
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    prop_id = prop.id
    seller = db.query(User).filter(User.role == "seller").first()
    db.close()

    with patch("app.routers.intelligence.generate_property_intelligence_report", side_effect=mock_ai_report_call):
        # Generate an active report first
        gen_res = client.post(f"/api/intelligence/properties/{prop_id}/report/generate", json={"force_refresh": True})
        assert gen_res.status_code == 200

    # Seller updates coordinates
    token = client.post("/api/auth/login", json={"email": seller.email, "password": "password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_res = client.put(f"/api/properties/{prop_id}", json={
        "latitude": 17.795, # Material coordinate change
        "longitude": 83.385
    }, headers=headers)
    assert update_res.status_code == 200

    # Verify that the report was marked stale in database
    db = TestingSessionLocal()
    stale_reports = db.query(PropertyIntelligenceReport).filter(
        PropertyIntelligenceReport.property_id == prop_id,
        PropertyIntelligenceReport.is_stale == True
    ).all()
    assert len(stale_reports) >= 1
    db.close()



def test_property_comparator_endpoint():
    """Test multi-property comparison endpoint (/api/intelligence/compare) with 2 properties."""
    db = TestingSessionLocal()
    p1 = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    p2 = db.query(Property).filter(Property.name == "Hillside Crest Villa").first()
    db.close()

    payload = {
        "property_ids": [p1.id, p2.id],
        "buyer_preferences": {
            "budget_max": 10000000.0,
            "intended_use": "family_home",
            "priorities": {"schools": 5, "transit": 4}
        }
    }
    res = client.post("/api/intelligence/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["properties"]) == 2
    assert "comparison_matrix" in data
    assert "tradeoffs_summary" in data
    assert len(data["tradeoffs_summary"]) >= 2
    assert "persona_recommendations" in data
    assert len(data["persona_recommendations"]) >= 2


def test_real_llm_evaluation_if_available():
    """
    Evaluates real model generation against the configured AI endpoint.
    If endpoint is unreachable, validates graceful fallback to rule analyst engine.
    """
    import asyncio
    db = TestingSessionLocal()
    prop = db.query(Property).filter(Property.name == "Seaside Pearl Residences").first()
    research = db.query(PropertyResearch).filter(PropertyResearch.property_id == prop.id).first()
    evidence = build_property_evidence_layer(prop, research, db)
    db.close()

    result = asyncio.run(generate_property_intelligence_report(evidence, {"budget_max": 8500000.0}))
    assert "report" in result
    assert "generation_source" in result
    assert result["generation_source"] in ["remote_llm", "deterministic_analyst_engine"]
    assert "executive_assessment" in result["report"]
    assert "evidence_citations_audit" in result["report"]
