import pytest
import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, Property, DataSource, PropertyResearch, ResearchJob
from app.auth import hash_password

# Use an isolated SQLite file database for test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hi_in.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Mocked responses for deterministic automated tests
MOCK_GEOCODE_RESULT = {
    "place_id": 250183311,
    "osm_id": 784255233,
    "osm_type": "node",
    "display_name": "Rushikonda, Visakhapatnam, Andhra Pradesh, 530045, India",
    "latitude": 17.784,
    "longitude": 83.376,
    "road": "Beach Road",
    "neighbourhood": "Rushikonda",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "postcode": "530045",
    "country": "India"
}

MOCK_AIR_QUALITY_RESULT = {
    "status": "available",
    "us_aqi": 74,
    "category": "Moderate",
    "dominant_pollutant": "pm2_5",
    "pm2_5": 23.1,
    "pm10": 46.5,
    "nitrogen_dioxide": 18.2,
    "ozone": 35.0,
    "sulphur_dioxide": 8.1,
    "retrieved_at": "2026-10-21T23:30:00Z"
}

MOCK_POI_RESULT = {
    "status": "success",
    "total_pois": 18,
    "tier_counts": {"under_1km": 6, "1_to_3km": 8, "3_to_5km": 4, "5_to_10km": 0},
    "categories": {
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
        ],
        "Lifestyle & Recreation": [
            {"id": 501, "name": "Rushikonda Blue Flag Beach", "category": "Lifestyle & Recreation", "type": "park", "latitude": 17.786, "longitude": 83.382, "distance_meters": 450, "distance_km": 0.45, "distance_tier": "under_1km"}
        ],
        "Public Services": [
            {"id": 601, "name": "Rushikonda Post Office", "category": "Public Services", "type": "post_office", "latitude": 17.781, "longitude": 83.374, "distance_meters": 510, "distance_km": 0.51, "distance_tier": "under_1km"}
        ]
    }
}

MOCK_ROUTE_RESULT = {
    "status": "success",
    "road_distance_km": 4.69,
    "straight_line_distance_km": 3.82,
    "estimated_duration_mins": 9,
    "tortuosity_ratio": 1.23,
    "route_geometry": [[83.376, 17.784], [83.379, 17.795], [83.385, 17.818]]
}

@pytest.fixture(autouse=True)
def mock_external_providers():
    """Deterministic fixtures for external spatial and telemetry APIs."""
    with patch("app.services.pipeline.reverse_geocode", return_value=MOCK_GEOCODE_RESULT), \
         patch("app.services.pipeline.fetch_air_quality", return_value=MOCK_AIR_QUALITY_RESULT), \
         patch("app.services.pipeline.fetch_nearby_pois", return_value=MOCK_POI_RESULT), \
         patch("app.services.pipeline.calculate_osrm_route", return_value=MOCK_ROUTE_RESULT):
        yield

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    # Pre-seed test users
    seller = User(
        email="test_seller@hi-in.com",
        hashed_password=hash_password("password123"),
        full_name="Test Seller",
        role="seller"
    )
    buyer = User(
        email="test_buyer@hi-in.com",
        hashed_password=hash_password("password123"),
        full_name="Test Buyer",
        role="buyer"
    )
    admin = User(
        email="test_admin@hi-in.com",
        hashed_password=hash_password("password123"),
        full_name="Test Admin",
        role="admin"
    )
    db.add_all([seller, buyer, admin])
    db.commit()
    db.close()

    yield

    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()

client = TestClient(app)

def get_auth_headers(email: str, password: str = "password123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# 1. Health check test
def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

# 2. Demo Login test
def test_demo_login():
    res = client.post("/api/auth/demo-login", json={"role": "buyer"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "buyer"

# 3. RBAC Enforcement: Buyer cannot create property
def test_buyer_cannot_create_property():
    buyer_headers = get_auth_headers("test_buyer@hi-in.com")
    payload = {
        "name": "Unauthorized Property",
        "property_type": "apartment",
        "locality": "Madhurawada",
        "address": "Test Road",
        "latitude": 17.79,
        "longitude": 83.35,
        "area": 1200,
        "asking_price": "₹60 Lakhs",
        "description": "Unauthorized attempt",
        "seller_name": "Test",
        "seller_contact": "test@test.com"
    }
    res = client.post("/api/properties", json=payload, headers=buyer_headers)
    assert res.status_code == 403

# 4. Seller can create, save draft, and publish property
def test_seller_property_crud_and_publishing():
    seller_headers = get_auth_headers("test_seller@hi-in.com")
    
    # Create published property
    payload = {
        "name": "Bay Horizon Residences",
        "property_type": "apartment",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "city": "Visakhapatnam",
        "locality": "Rushikonda",
        "address": "Beach Road, Rushikonda",
        "latitude": 17.784,
        "longitude": 83.376,
        "area": 1750.0,
        "area_unit": "sq ft",
        "asking_price": "₹85 Lakhs",
        "total_price": 8500000.0,
        "description": "Scenic beachfront residences overlooking Bay of Bengal.",
        "amenities": ["Swimming Pool", "Gymnasium", "Covered Parking"],
        "utilities": ["Power Backup", "Municipal Water"],
        "construction_status": "Ready to Move",
        "seller_name": "Bay Horizon Developers",
        "seller_contact": "+91 891 222 3333",
        "status": "published"
    }
    res = client.post("/api/properties", json=payload, headers=seller_headers)
    assert res.status_code == 201
    prop = res.json()
    assert prop["name"] == "Bay Horizon Residences"
    assert prop["verification_status"] == "Seller provided / Unverified"
    prop_id = prop["id"]

    # Retrieve property detail
    detail_res = client.get(f"/api/properties/{prop_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["views_count"] >= 1

    # Edit property
    edit_payload = {"asking_price": "₹88 Lakhs", "total_price": 8800000.0}
    edit_res = client.put(f"/api/properties/{prop_id}", json=edit_payload, headers=seller_headers)
    assert edit_res.status_code == 200
    assert edit_res.json()["asking_price"] == "₹88 Lakhs"

# 5. Buyer discovery and filtering
def test_buyer_discovery_and_search():
    res = client.get("/api/properties?search=Rushikonda&property_type=apartment")
    assert res.status_code == 200
    listings = res.json()
    assert len(listings) >= 1
    assert any(p["name"] == "Bay Horizon Residences" for p in listings)

# 6. Wishlist workflow
def test_wishlist_workflow():
    buyer_headers = get_auth_headers("test_buyer@hi-in.com")
    
    props = client.get("/api/properties").json()
    prop_id = props[0]["id"]
    
    add_res = client.post(f"/api/wishlists/{prop_id}", headers=buyer_headers)
    assert add_res.status_code in (200, 201)
    
    list_res = client.get("/api/wishlists", headers=buyer_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["property_id"] == prop_id for item in items)
    
    del_res = client.delete(f"/api/wishlists/{prop_id}", headers=buyer_headers)
    assert del_res.status_code == 204

# 7. Enquiry workflow: Buyer submits -> Seller receives & replies
def test_enquiry_workflow():
    buyer_headers = get_auth_headers("test_buyer@hi-in.com")
    seller_headers = get_auth_headers("test_seller@hi-in.com")
    
    props = client.get("/api/properties").json()
    prop_id = props[0]["id"]
    
    enquiry_payload = {
        "property_id": prop_id,
        "buyer_name": "Test Buyer",
        "buyer_email": "test_buyer@hi-in.com",
        "buyer_phone": "+91 99999 88888",
        "message": "Interested in visiting the site this Saturday morning."
    }
    submit_res = client.post("/api/enquiries", json=enquiry_payload, headers=buyer_headers)
    assert submit_res.status_code == 201
    enquiry = submit_res.json()
    enquiry_id = enquiry["id"]
    assert enquiry["status"] == "pending"
    
    seller_enquiries = client.get("/api/seller/enquiries", headers=seller_headers).json()
    assert any(e["id"] == enquiry_id for e in seller_enquiries)
    
    reply_payload = {"reply": "We look forward to hosting your visit! Our sales executive will call you."}
    reply_res = client.post(f"/api/seller/enquiries/{enquiry_id}/reply", json=reply_payload, headers=seller_headers)
    assert reply_res.status_code == 200
    assert reply_res.json()["status"] == "responded"
    assert reply_res.json()["seller_reply"] == reply_payload["reply"]

# 8. Admin controls: Overview, status change (suspend/approve), audit log
def test_admin_oversight_and_moderation():
    admin_headers = get_auth_headers("test_admin@hi-in.com")
    
    overview_res = client.get("/api/admin/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    overview = overview_res.json()
    assert overview["total_listings"] >= 1
    assert overview["total_users"] >= 3
    
    props = client.get("/api/properties").json()
    prop_id = props[0]["id"]
    
    suspend_res = client.patch(
        f"/api/admin/properties/{prop_id}/status",
        json={"status": "suspended", "reason": "Verifying documentation discrepancies"},
        headers=admin_headers
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "suspended"
    
    public_props = client.get("/api/properties").json()
    assert not any(p["id"] == prop_id for p in public_props)
    
    approve_res = client.patch(
        f"/api/admin/properties/{prop_id}/status",
        json={"status": "published", "reason": "Verified clear title"},
        headers=admin_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "published"
    
    audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1

# 9. Location Intelligence authentic response
def test_location_intelligence_endpoint():
    props = client.get("/api/properties").json()
    prop_id = props[0]["id"]
    
    res = client.get(f"/api/intelligence/properties/{prop_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["property_id"] == prop_id
    assert "coordinates" in data
    assert "status" in data
    assert "air_quality" in data
    assert "connectivity" in data
    assert "nearby_pois" in data
    assert data["status"] in ["completed", "partially_completed"]

# 10. Coordinate bounds validation: Reject invalid coordinates
def test_coordinate_bounds_validation():
    seller_headers = get_auth_headers("test_seller@hi-in.com")

    bad_lat_payload = {
        "name": "Invalid Lat Property",
        "property_type": "apartment",
        "locality": "Madhurawada",
        "address": "Test Address",
        "latitude": 195.5,
        "longitude": 83.35,
        "area": 1200,
        "asking_price": "85 Lakhs"
    }
    res_lat = client.post("/api/properties", json=bad_lat_payload, headers=seller_headers)
    assert res_lat.status_code == 422

    bad_lng_payload = {
        "name": "Invalid Lng Property",
        "property_type": "apartment",
        "locality": "Madhurawada",
        "address": "Test Address",
        "latitude": 17.75,
        "longitude": 283.35,
        "area": 1200,
        "asking_price": "85 Lakhs"
    }
    res_lng = client.post("/api/properties", json=bad_lng_payload, headers=seller_headers)
    assert res_lng.status_code == 422

# 11. Security & Hygiene: Seller cannot override administrative suspension
def test_suspended_property_seller_cannot_unsuspend():
    admin_headers = get_auth_headers("test_admin@hi-in.com")
    seller_headers = get_auth_headers("test_seller@hi-in.com")

    props = client.get("/api/properties").json()
    prop_id = props[0]["id"]

    suspend_res = client.patch(
        f"/api/admin/properties/{prop_id}/status",
        json={"status": "suspended", "reason": "Due diligence audit pending"},
        headers=admin_headers
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "suspended"

    override_res = client.put(
        f"/api/properties/{prop_id}",
        json={"status": "published"},
        headers=seller_headers
    )
    assert override_res.status_code == 403

    seller_suspend = client.put(
        f"/api/properties/{prop_id}",
        json={"status": "suspended"},
        headers=seller_headers
    )
    assert seller_suspend.status_code == 403

    reinstate_res = client.patch(
        f"/api/admin/properties/{prop_id}/status",
        json={"status": "published", "reason": "Audit cleared"},
        headers=admin_headers
    )
    assert reinstate_res.status_code == 200

# 12. Role boundary isolation: Strict unauthorized endpoint blocking
def test_role_boundary_isolation():
    buyer_headers = get_auth_headers("test_buyer@hi-in.com")
    seller_headers = get_auth_headers("test_seller@hi-in.com")

    res_b_admin = client.get("/api/admin/overview", headers=buyer_headers)
    assert res_b_admin.status_code == 403

    res_s_admin = client.get("/api/admin/overview", headers=seller_headers)
    assert res_s_admin.status_code == 403

    res_b_seller = client.get("/api/seller/properties", headers=buyer_headers)
    assert res_b_seller.status_code == 403

    res_anon_seller = client.get("/api/seller/properties")
    assert res_anon_seller.status_code == 401

    res_anon_admin = client.get("/api/admin/overview")
    assert res_anon_admin.status_code == 401

# 13. Geocoding search endpoint
def test_geocoding_search():
    with patch("app.routers.geocoding.forward_geocode", return_value=[MOCK_GEOCODE_RESULT]):
        res = client.get("/api/geocoding/search?q=Rushikonda&limit=2")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
        assert "latitude" in data[0]
        assert "longitude" in data[0]

# 14. Road route calculation endpoint
def test_routing_calculation():
    with patch("app.routers.routing.calculate_osrm_route", return_value=MOCK_ROUTE_RESULT):
        res = client.post("/api/routing/route", json={
            "origin_lat": 17.784,
            "origin_lon": 83.376,
            "dest_lat": 17.818,
            "dest_lon": 83.385,
            "destination_name": "Rushikonda IT SEZ"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["road_distance_km"] == 4.69
        assert data["estimated_duration_mins"] == 9

# 15. Admin live source ping and health verification
def test_admin_live_sources_ping():
    admin_headers = get_auth_headers("test_admin@hi-in.com")
    res = client.post("/api/admin/sources/live-check", headers=admin_headers)
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 4
    names = [s["name"] for s in sources]
    assert any("Nominatim" in n for n in names)
    assert any("OSRM" in n for n in names)
    assert any("Air Quality" in n for n in names)
    assert all(s["latency_ms"] >= 0 for s in sources)

# 16. Admin research job retry control
def test_admin_job_retry_control():
    admin_headers = get_auth_headers("test_admin@hi-in.com")
    buyer_headers = get_auth_headers("test_buyer@hi-in.com")

    jobs = client.get("/api/admin/jobs", headers=admin_headers).json()
    if len(jobs) == 0:
        seller_headers = get_auth_headers("test_seller@hi-in.com")
        res_create = client.post("/api/properties", json={
            "name": "Retry Test Property",
            "property_type": "apartment",
            "locality": "Rushikonda",
            "address": "Beach Road",
            "latitude": 17.78,
            "longitude": 83.37,
            "area": 1200,
            "asking_price": "₹60 Lakhs",
            "total_price": 6000000.0,
            "description": "Test property description for retry test.",
            "seller_name": "Test Builder",
            "seller_contact": "+91 999 888 7777",
            "status": "published"
        }, headers=seller_headers)
        assert res_create.status_code == 201
        jobs = client.get("/api/admin/jobs", headers=admin_headers).json()

    assert len(jobs) > 0
    target_job = jobs[0]

    # Buyer cannot retry (RBAC check)
    unauth_res = client.post(f"/api/admin/jobs/{target_job['id']}/retry", headers=buyer_headers)
    assert unauth_res.status_code == 403

    # Admin can retry
    retry_res = client.post(f"/api/admin/jobs/{target_job['id']}/retry", headers=admin_headers)
    assert retry_res.status_code == 200
    new_job = retry_res.json()
    assert new_job["property_id"] == target_job["property_id"]
    assert new_job["status"] in ["queued", "completed", "in_progress", "partially_completed"]

