import datetime
from sqlalchemy.orm import Session
from app import models
from app.auth import hash_password

def seed_database(db: Session):
    # 1. Seed Demo Users if not present
    seller = db.query(models.User).filter(models.User.email == "seller@hi-in.demo").first()
    if not seller:
        seller = models.User(
            email="seller@hi-in.demo",
            hashed_password=hash_password("demopass123"),
            full_name="Ramez Infra Developers",
            role="seller"
        )
        db.add(seller)

    buyer = db.query(models.User).filter(models.User.email == "buyer@hi-in.demo").first()
    if not buyer:
        buyer = models.User(
            email="buyer@hi-in.demo",
            hashed_password=hash_password("demopass123"),
            full_name="Kiran Kumar (Buyer)",
            role="buyer"
        )
        db.add(buyer)

    admin = db.query(models.User).filter(models.User.email == "admin@hi-in.demo").first()
    if not admin:
        admin = models.User(
            email="admin@hi-in.demo",
            hashed_password=hash_password("demopass123"),
            full_name="HI IN Platform Admin",
            role="admin"
        )
        db.add(admin)

    db.commit()
    db.refresh(seller)
    db.refresh(buyer)
    db.refresh(admin)

    # 2. Seed Demo Properties if no properties exist
    if db.query(models.Property).count() == 0:
        demo_properties = [
            {
                "seller_id": seller.id,
                "name": "Ramez Seapoint",
                "property_type": "apartment",
                "state": "Andhra Pradesh",
                "district": "Visakhapatnam",
                "city": "Visakhapatnam",
                "locality": "Madhurawada",
                "address": "Near Rushikonda Beach Road, Madhurawada, Visakhapatnam 530048",
                "latitude": 17.7944,
                "longitude": 83.3574,
                "area": 1850.0,
                "area_unit": "sq ft",
                "road_access_m": 18.0,
                "frontage_m": 45.0,
                "survey_number": "SY-142/2B",
                "asking_price": "₹75 L - 1.2 Cr",
                "total_price": 9500000.0,
                "payment_terms": "20% booking, 80% construction linked milestones",
                "additional_charges": "Clubhouse & Car Parking: ₹3.5 Lakhs",
                "maintenance_charges": "₹3.0 / sq ft / month",
                "availability_date": "Dec 2026",
                "description": "Ramez Seapoint is a residential project in Madhurawada, Visakhapatnam, offering 2 & 3 BHK apartments with sea-facing and city views. Modern amenities and coastal connectivity.",
                "amenities": ["Swimming Pool", "Gymnasium", "Landscaped Gardens", "24/7 Security", "Children Play Area", "Covered Parking"],
                "utilities": ["100% Power Backup", "Municipal Water Connection", "Rainwater Harvesting", "STP Plant"],
                "floors": 15,
                "towers": 4,
                "unit_count": 480,
                "construction_status": "Under Construction",
                "photos": [
                    {"url": "/assets/ramez_seapoint.jpg", "caption": "Architectural Elevation"},
                    {"url": "/assets/vizag_hero.jpg", "caption": "Coastal Bay View"}
                ],
                "documents": [
                    {"name": "RERA Registration Certificate", "url": "/docs/rera_ramez.pdf", "tag": "ok", "size": "1.2 MB"},
                    {"name": "Approved Sanction Plan", "url": "/docs/plan_ramez.pdf", "tag": "ok", "size": "2.4 MB"},
                    {"name": "Project Brochure", "url": "/docs/brochure_ramez.pdf", "tag": "ok", "size": "3.1 MB"}
                ],
                "seller_name": "Ramez Infra Developers Pvt Ltd",
                "seller_contact": "+91 891 278 4590 / sales@ramezinfra.com",
                "possession_date": "Dec 2026",
                "developer_profile": "Reputed regional builder with over 14 completed residential enclaves across Visakhapatnam.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 142
            },
            {
                "seller_id": seller.id,
                "name": "Sreeja Ocean View",
                "property_type": "apartment",
                "state": "Andhra Pradesh",
                "district": "Visakhapatnam",
                "city": "Visakhapatnam",
                "locality": "Rushikonda",
                "address": "Beach Road Promenade, Rushikonda Coastal Corridor, Visakhapatnam 530045",
                "latitude": 17.7818,
                "longitude": 83.3776,
                "area": 1650.0,
                "area_unit": "sq ft",
                "road_access_m": 24.0,
                "frontage_m": 60.0,
                "survey_number": "SY-89/1A",
                "asking_price": "₹68 L - 1.1 Cr",
                "total_price": 8800000.0,
                "payment_terms": "Immediate registration upon 100% payment",
                "additional_charges": "Registration and stamp duty extra as applicable",
                "maintenance_charges": "₹2.5 / sq ft / month",
                "availability_date": "Immediate",
                "description": "Luxury oceanfront high-rise apartment project situated on Rushikonda Beach Road featuring unobstructed Bay of Bengal views and immediate access to IT SEZ.",
                "amenities": ["Infinity Pool", "Sea-view Clubhouse", "Tennis Court", "High-speed Lifts", "100% Power Backup"],
                "utilities": ["Treated Water Supply", "Underground Cabling", "Solar Water Heating"],
                "floors": 18,
                "towers": 2,
                "unit_count": 180,
                "construction_status": "Ready to Move",
                "photos": [
                    {"url": "/assets/sreeja_ocean_view.jpg", "caption": "Tower Front Elevation"}
                ],
                "documents": [
                    {"name": "Occupancy Certificate (OC)", "url": "/docs/oc_sreeja.pdf", "tag": "ok", "size": "1.8 MB"},
                    {"name": "Fire NOC", "url": "/docs/fire_noc.pdf", "tag": "ok", "size": "850 KB"}
                ],
                "seller_name": "Sreeja Infra Projects",
                "seller_contact": "+91 891 254 9901 / contact@sreejaprojects.com",
                "possession_date": "Ready to Move",
                "developer_profile": "Premium coastal developers specializing in high-rise coastal residences.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 98
            },
            {
                "seller_id": seller.id,
                "name": "Urbanrise The Coast",
                "property_type": "apartment",
                "state": "Andhra Pradesh",
                "district": "Visakhapatnam",
                "city": "Visakhapatnam",
                "locality": "Madhurawada",
                "address": "Near IT SEZ Hill 2, Madhurawada, Visakhapatnam 530048",
                "latitude": 17.8080,
                "longitude": 83.3510,
                "area": 1950.0,
                "area_unit": "sq ft",
                "road_access_m": 15.0,
                "frontage_m": 40.0,
                "survey_number": "SY-210/4",
                "asking_price": "₹82 L - 1.4 Cr",
                "total_price": 11000000.0,
                "payment_terms": "10:80:10 scheme available",
                "additional_charges": "Car Parking: ₹2.5 Lakhs",
                "maintenance_charges": "₹3.2 / sq ft / month",
                "availability_date": "Jun 2027",
                "description": "Ultra-luxury gated community in the heart of Madhurawada tech corridor. High ceiling apartments with private balconies.",
                "amenities": ["Clubhouse", "Squash Court", "Jogging Track", "EV Charging Bays", "Library"],
                "utilities": ["Dual Plumbing", "Fiber-to-home", "Automated DGF Power Backup"],
                "floors": 20,
                "towers": 5,
                "unit_count": 620,
                "construction_status": "Under Construction",
                "photos": [
                    {"url": "/assets/urbanrise_the_coast.jpg", "caption": "Master Perspective"}
                ],
                "documents": [
                    {"name": "RERA Approval", "url": "/docs/rera_urbanrise.pdf", "tag": "ok", "size": "1.4 MB"}
                ],
                "seller_name": "Urbanrise Real Estate Ventures",
                "seller_contact": "+91 98480 12345 / info@urbanrisecoast.com",
                "possession_date": "Jun 2027",
                "developer_profile": "National builder with footprint across Hyderabad, Chennai, and Visakhapatnam.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 64
            },
            {
                "seller_id": seller.id,
                "name": "MVV & MK Park",
                "property_type": "apartment",
                "state": "Andhra Pradesh",
                "district": "Visakhapatnam",
                "city": "Visakhapatnam",
                "locality": "MVP Colony",
                "address": "Sector 9, MVP Colony Central, Visakhapatnam 530017",
                "latitude": 17.7420,
                "longitude": 83.3320,
                "area": 1450.0,
                "area_unit": "sq ft",
                "road_access_m": 12.0,
                "frontage_m": 35.0,
                "survey_number": "SY-45/1C",
                "asking_price": "₹64 - 95 L",
                "total_price": 7800000.0,
                "payment_terms": "Flexible home loan options with SBI / HDFC",
                "additional_charges": "Corpus Fund: ₹1.0 Lakh",
                "maintenance_charges": "₹2.0 / sq ft / month",
                "availability_date": "Immediate",
                "description": "Mature, established residential neighborhood with immediate walking distance to premier schools, specialty hospitals, and supermarkets.",
                "amenities": ["Rooftop Garden", "Intercom", "Elevator", "CCTV Surveillance"],
                "utilities": ["GVMC Water Supply", "Borewell", "Single Phase Power"],
                "floors": 6,
                "towers": 1,
                "unit_count": 24,
                "construction_status": "Ready to Move",
                "photos": [
                    {"url": "/assets/mvv_mk_park.jpg", "caption": "Street Facade"}
                ],
                "documents": [
                    {"name": "GVMC Sanctioned Plan", "url": "/docs/gvmc_plan.pdf", "tag": "ok", "size": "2.1 MB"}
                ],
                "seller_name": "MVV Builders & Promoters",
                "seller_contact": "+91 891 250 8822 / mvv@mvvbuilders.com",
                "possession_date": "Ready to Move",
                "developer_profile": "Veteran builder with 25+ years delivering mid-segment and luxury apartments in MVP Colony.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 112
            }
        ]

        for p_data in demo_properties:
            p = models.Property(**p_data)
            db.add(p)
            db.commit()
            db.refresh(p)

            # Add research job
            job = models.ResearchJob(
                property_id=p.id,
                job_type="Spatial Context & POI Discovery",
                status="completed",
                result_summary="Phase 1 spatial indexing complete. Stored coordinates verified."
            )
            db.add(job)

    # 3. Seed Data Sources if empty
    if db.query(models.DataSource).count() == 0:
        sources = [
            models.DataSource(name="OpenStreetMap Nominatim Spatial Engine", source_type="Spatial POI Search", status="healthy", latency_ms=118),
            models.DataSource(name="Open-Meteo & Copernicus Atmospheric Grid", source_type="Telemetry (AQI & Weather)", status="healthy", latency_ms=95),
            models.DataSource(name="OSRM Travel Time & Routing Graph", source_type="Road Network Graph", status="healthy", latency_ms=142),
            models.DataSource(name="CPCB / Janvayu Sensor Grid", source_type="Continuous Ambient Air Telemetry", status="healthy", latency_ms=210)
        ]
        db.add_all(sources)

    # 4. Seed Data Quality Issues if empty
    if db.query(models.DataQualityIssue).count() == 0:
        first_prop = db.query(models.Property).first()
        if first_prop:
            issue = models.DataQualityIssue(
                property_id=first_prop.id,
                severity="low",
                issue_description="Environmental clearance pending official filing upload from developer.",
                status="open"
            )
            db.add(issue)

    # 5. Add initial audit log entry
    if db.query(models.AuditLog).count() == 0:
        audit = models.AuditLog(
            user_id=admin.id,
            action="SYSTEM_INITIALIZED",
            target_type="System",
            target_id=1,
            details="HI IN Property Directory Phase 1 database initialized with demonstration seed data."
        )
        db.add(audit)

    db.commit()
