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
            full_name="Ramky Estates & Projects",
            role="seller"
        )
        db.add(seller)
    else:
        seller.full_name = "Ramky Estates & Projects"

    buyer = db.query(models.User).filter(models.User.email == "buyer@hi-in.demo").first()
    if not buyer:
        buyer = models.User(
            email="buyer@hi-in.demo",
            hashed_password=hash_password("demopass123"),
            full_name="Rahul Verma (Buyer)",
            role="buyer"
        )
        db.add(buyer)

    admin = db.query(models.User).filter(models.User.email == "admin@hi-in.demo").first()
    if not admin:
        admin = models.User(
            email="admin@hi-in.demo",
            hashed_password=hash_password("demopass123"),
            full_name="HiiN Platform Governance",
            role="admin"
        )
        db.add(admin)

    db.commit()
    db.refresh(seller)
    db.refresh(buyer)
    db.refresh(admin)

    # 2. Check if Ramky Kingston Park Orbit already exists
    ramky = db.query(models.Property).filter(models.Property.name.like("%Ramky Kingston%")).first()
    if ramky and ramky.modules_data:
        md = dict(ramky.modules_data)
        import copy
        from sqlalchemy.orm.attributes import flag_modified
        md_copy = copy.deepcopy(md)
        modified = False
        if "pricing_breakdown" in md and "floor_rise" not in md["pricing_breakdown"]:
            md_copy["pricing_breakdown"]["floor_rise"] = 25.0
            modified = True
        if "configurations" in md_copy and len(md_copy["configurations"]) >= 2:
            c1 = md_copy["configurations"][0]
            if c1.get("balcony_sqft") != 104.0 or c1.get("common_area_sqft") != 299.0:
                c1["balcony_sqft"] = 104.0
                c1["common_area_sqft"] = 299.0
                modified = True
            c2 = md_copy["configurations"][1]
            if c2.get("balcony_sqft") != 94.0 or c2.get("common_area_sqft") != 489.0:
                c2["balcony_sqft"] = 94.0
                c2["common_area_sqft"] = 489.0
                modified = True
        if modified:
            ramky.modules_data = md_copy
            flag_modified(ramky, "modules_data")
            db.commit()
    if not ramky:
        # Clear legacy properties to seamlessly transition to Hyderabad HiiN dataset
        db.query(models.Property).delete()
        db.commit()

        # Build Hyderabad Properties Dataset matching portal-property.netlify.app
        properties_data = [
            # 1. Primary Showcase: Ramky Kingston Park Orbit
            {
                "seller_id": seller.id,
                "name": "Ramky Kingston Park Orbit",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Gopanapally",
                "address": "Gopanapally X Roads, Financial District Corridor, Gopanapally, Hyderabad 500046",
                "latitude": 17.4350,
                "longitude": 78.3180,
                "area": 1880.0,
                "area_unit": "sq ft",
                "road_access_m": 30.0,
                "frontage_m": 75.0,
                "survey_number": "SY-128/1 & 129",
                "asking_price": "₹1.12 – 1.62 Cr",
                "total_price": 13700000.0,
                "payment_terms": "20% booking, 80% construction linked milestones",
                "additional_charges": "Facing: ₹100/sqft, Floor rise: ₹50/sqft per floor, View: ₹100/sqft, Corpus: ₹120/sqft",
                "maintenance_charges": "₹3.5 / sq ft / month",
                "availability_date": "Jun 2027",
                "description": "Ramky Kingston Park Orbit is a 16.5-acre luxury residential community in Gopanapally, Hyderabad, featuring 6 modern towers with central landscaped gardens, podium amenities, and direct arterial connectivity to the Financial District and Gachibowli IT corridor.",
                "amenities": [
                    "Swimming pool", "Gym", "Kids' play area", "Jogging track", "Indoor games room",
                    "Party hall", "Co-working space", "Library", "Crèche", "Table tennis",
                    "Yoga deck", "Tennis court", "Basketball court", "Amphitheatre", "Seating plaza", "Cricket practice nets"
                ],
                "utilities": [
                    "100% DG Power Backup", "Municipal Water Supply", "Rainwater Harvesting (14 pits)",
                    "Sewage Treatment Plant (STP)", "Solar Power Generation", "EV Charging Points"
                ],
                "floors": 24,
                "towers": 6,
                "unit_count": 1406,
                "construction_status": "Under Construction",
                "photos": [
                    {"url": "/assets/ramez_seapoint.jpg", "caption": "Tower Architectural Elevation"},
                    {"url": "/assets/vizag_hero.jpg", "caption": "Central Greens & Landscaped Podium"}
                ],
                "documents": [
                    {"name": "TS RERA Certificate (P02400005891)", "url": "/docs/ts_rera_ramky.pdf", "tag": "ok", "size": "1.4 MB"},
                    {"name": "GHMC Sanctioned Blueprint", "url": "/docs/ghmc_sanction_ramky.pdf", "tag": "ok", "size": "3.8 MB"},
                    {"name": "Environmental Clearance Certificate", "url": "/docs/ec_ramky.pdf", "tag": "ok", "size": "950 KB"},
                    {"name": "Project Brochure & Area Schedule", "url": "/docs/brochure_ramky.pdf", "tag": "ok", "size": "4.2 MB"}
                ],
                "seller_name": "Ramky Estates & Projects Ltd",
                "seller_contact": "+91 40 2331 0110 / sales@ramkyestates.com",
                "possession_date": "Jun 2027",
                "developer_profile": "Pioneer real estate and infrastructure development enterprise with over 30 years of delivery track record across South India.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 348,
                "modules_data": {
                    "base_rate": 8600.0,
                    "unitSizeRange": "1,050–1,480",
                    "configurations": [
                        {
                            "bhk": 2,
                            "name": "2 BHK Premium",
                            "sbu_sqft": 1300,
                            "carpet_sqft": 897,
                            "balcony_sqft": 104.0,
                            "common_area_sqft": 299.0,
                            "price_cr": 1.12,
                            "price_text": "₹1.12 Cr",
                            "facing": "East / West",
                            "balconies": 1,
                            "bathrooms": 2,
                            "rooms": ["Living / dining (18' x 11')", "Master bedroom (12' x 13')", "Bedroom 2 (11' x 11')", "Kitchen (8' x 10')", "Balcony (5' x 10')"]
                        },
                        {
                            "bhk": 3,
                            "name": "3 BHK Luxury",
                            "sbu_sqft": 1880,
                            "carpet_sqft": 1297,
                            "balcony_sqft": 94.0,
                            "common_area_sqft": 489.0,
                            "price_cr": 1.62,
                            "price_text": "₹1.62 Cr",
                            "facing": "North / East",
                            "balconies": 2,
                            "bathrooms": 3,
                            "rooms": ["Living / dining (22' x 12')", "Master bedroom (14' x 14')", "Bedroom 2 (12' x 12')", "Bedroom 3 (11' x 11')", "Kitchen (9' x 11')", "Balcony (6' x 12')"]
                        }
                    ],
                    "pricing_breakdown": {
                        "base_rate": 8600.0,
                        "floor_rise": 25.0,
                        "facing_premium": "₹100 / sq ft",
                        "floor_rise_premium": "₹50 / sq ft per floor",
                        "view_premium": "₹100 / sq ft",
                        "corpus_fund": "₹120 / sq ft",
                        "registration_charges": "As applicable (7.5% stamp duty + 0.5% registration)",
                        "current_offer": "Book by 31 Dec: no floor-rise charges"
                    },
                    "master_plan": {
                        "acreage": 16.5,
                        "green_cover_pct": 68,
                        "towers_count": 6,
                        "podium_desc": "Central greens with peripheral vehicular circulation loop ensuring zero traffic inside community park",
                        "circulation_desc": "Pedestrian walkways connect all 6 towers directly to central clubhouse and sports zone"
                    },
                    "towers": [
                        {"tower_number": "1", "units_count": 234, "floors": 24, "units_per_floor": 4, "passenger_lifts": 3, "service_lifts": 1, "visitor_parking": "Yes", "basement": "Podium above"},
                        {"tower_number": "2", "units_count": 234, "floors": 24, "units_per_floor": 4, "passenger_lifts": 3, "service_lifts": 1, "visitor_parking": "Yes", "basement": "Podium above"},
                        {"tower_number": "3", "units_count": 235, "floors": 24, "units_per_floor": 4, "passenger_lifts": 3, "service_lifts": 1, "visitor_parking": "Yes", "basement": "Podium above"},
                        {"tower_number": "4", "units_count": 235, "floors": 24, "units_per_floor": 4, "passenger_lifts": 3, "service_lifts": 1, "visitor_parking": "Yes", "basement": "Podium above"},
                        {"tower_number": "5", "units_count": 234, "floors": 24, "units_per_floor": 4, "passenger_lifts": 3, "service_lifts": 1, "visitor_parking": "Yes", "basement": "Podium above"},
                        {"tower_number": "6", "units_count": 234, "floors": 24, "units_per_floor": 4, "passenger_lifts": 3, "service_lifts": 1, "visitor_parking": "Yes", "basement": "Podium above"}
                    ],
                    "liveability_ratings": [
                        {"category": "Parks", "verdict": "Good", "score_text": "4.1 / 5 · 128 ratings", "stars": 4, "source": "From Google Maps reviews"},
                        {"category": "Cycle tracks", "verdict": "Good", "score_text": "3.6 / 5 · 74 ratings", "stars": 4, "source": "From Google Maps reviews"},
                        {"category": "Footpaths", "verdict": "Average", "score_text": "3.1 / 5 · 96 ratings", "stars": 3, "source": "From resident reviews on this site"},
                        {"category": "Pedestrian safety", "verdict": "Good", "score_text": "4 / 5 · 23 ratings", "stars": 3, "source": "From resident reviews on this site"},
                        {"category": "Traffic & noise", "verdict": "Moderate", "score_text": "62 dB daytime", "stars": 3, "source": "TSPCB noise monitor, Gachibowli"},
                        {"category": "Air quality", "verdict": "Satisfactory", "score_text": "AQI 94", "stars": 3, "source": "Live from CPCB · updated hourly"}
                    ],
                    "commute_hubs": [
                        {"name": "DLF Cyber City", "subtitle": "Office park · Gachibowli", "distance_km": "8.5", "duration_mins": 22},
                        {"name": "Gachibowli Stadium", "subtitle": "Sports venue · Gachibowli", "distance_km": "9.0", "duration_mins": 24},
                        {"name": "Indian School of Business (ISB)", "subtitle": "Campus · Gachibowli", "distance_km": "10.0", "duration_mins": 25},
                        {"name": "Durgam Cheruvu", "subtitle": "Lake & cable bridge", "distance_km": "10.5", "duration_mins": 28},
                        {"name": "Rajiv Gandhi International Airport (HYD)", "subtitle": "Aviation Hub · Shamshabad", "distance_km": "32.0", "duration_mins": 45}
                    ],
                    "sustainability": [
                        {"name": "Rainwater harvesting", "icon": "rainwater", "details": "14 recharge pits across site · 2,50,000 litres capacity", "available": True},
                        {"name": "Solar power generation", "icon": "solar", "details": "Rooftop solar panels power common area lighting", "available": True},
                        {"name": "Sewage treatment plant (STP)", "icon": "water", "details": "100% treated wastewater recycled for landscaping and flushing", "available": True},
                        {"name": "EV charging points", "icon": "ev", "details": "Designated EV charging bays across all tower basements", "available": True},
                        {"name": "Building automation (BMS)", "icon": "automation", "details": "Automated pump, energy, and water management sensors", "available": True},
                        {"name": "Waste segregation", "icon": "waste", "details": "Dry and wet organic composting unit on site", "available": True},
                        {"name": "Greywater recycling", "icon": "recycle", "details": "Dual plumbing system", "available": False},
                        {"name": "Smart home provision", "icon": "smart", "details": "Smart digital door locks ready", "available": False}
                    ],
                    "safety": [
                        {"name": "24/7 security", "icon": "guard", "details": "Trained security personnel with boom barrier vehicle access control", "available": True},
                        {"name": "CCTV surveillance", "icon": "cctv", "details": "360-degree high-definition perimeter and lobby surveillance", "available": True},
                        {"name": "Visitor management system", "icon": "visitor", "details": "Digital app-based guest and delivery verification", "available": True},
                        {"name": "Emergency evacuation plan", "icon": "fire", "details": "Pressurized fire staircases and automated smoke dampers", "available": True},
                        {"name": "Safety certification", "icon": "certificate", "details": "Telangana State Disaster Response and Fire Services NOC", "available": True},
                        {"name": "Intercom / video door phones", "icon": "intercom", "details": "Direct lobby to apartment video calling", "available": False}
                    ],
                    "neighbourhood_places": {
                        "Daily Needs": [
                            ["Ratnadeep Supermarket", "Groceries · Nallagandla", "1.2 km"],
                            ["Q-Mart Gachibowli", "Gourmet Groceries", "4.8 km"]
                        ],
                        "Schools": [
                            ["Glendale Academy", "School · CBSE", "2.1 km"],
                            ["Oakridge International", "School · CBSE, IB", "3.4 km"]
                        ],
                        "Bus stops": [
                            ["Gopanapally X Roads", "Bus stop · TSRTC", "0.8 km"],
                            ["Nallagandla", "Bus stop · TSRTC", "1.6 km"],
                            ["Gachibowli DLF", "Bus stop · TSRTC", "4.2 km"]
                        ],
                        "Metro stations": [
                            ["Jubilee Hills Checkpost", "Metro station · Blue Line", "3.0 km"],
                            ["Peddamma Gudi", "Metro station · Blue Line", "3.5 km"],
                            ["Madhapur", "Metro station · Blue Line", "4.5 km"]
                        ]
                    }
                }
            },

            # 2. Solace Residences (Gopanapally)
            {
                "seller_id": seller.id,
                "name": "Solace Residences",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Gopanapally",
                "address": "Near Tellapur Highway Junction, Gopanapally, Hyderabad 500046",
                "latitude": 17.4390,
                "longitude": 78.3120,
                "area": 1450.0,
                "area_unit": "sq ft",
                "road_access_m": 24.0,
                "frontage_m": 50.0,
                "survey_number": "SY-145/2",
                "asking_price": "₹98 L – 1.45 Cr",
                "total_price": 12100000.0,
                "payment_terms": "10:80:10 Construction Linked Plan",
                "additional_charges": "Car parking & Clubhouse: ₹4 Lakhs",
                "maintenance_charges": "₹3.0 / sq ft / month",
                "availability_date": "Jun 2029",
                "description": "Solace Residences offers serene urban living in Gopanapally across 5.4 acres with 3 high-rise towers, 33 floors, landscaped courtyards, and scenic balcony views.",
                "amenities": ["Swimming Pool", "Gym", "Clubhouse", "Children Play Area", "EV Charging", "Power Backup"],
                "utilities": ["Municipal Water Supply", "100% DG Backup", "Rainwater Harvesting"],
                "floors": 33,
                "towers": 3,
                "unit_count": 1040,
                "construction_status": "New Launch",
                "photos": [{"url": "/assets/sreeja_ocean_view.jpg", "caption": "Solace Towers Rendering"}],
                "documents": [{"name": "TS RERA Application", "url": "/docs/ts_rera_solace.pdf", "tag": "ok", "size": "1.2 MB"}],
                "seller_name": "Solace Realty Pvt Ltd",
                "seller_contact": "+91 40 4589 1200 / info@solacerealty.com",
                "possession_date": "Jun 2029",
                "developer_profile": "Specialist residential developers creating boutique gated living spaces.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 182,
                "modules_data": {
                    "base_rate": 8300.0,
                    "unitSizeRange": "820–1,180",
                    "configurations": [
                        {"bhk": 2, "name": "2 BHK Smart", "sbu_sqft": 1180, "carpet_sqft": 820, "price_cr": 0.98, "price_text": "₹98 L"},
                        {"bhk": 3, "name": "3 BHK Comfort", "sbu_sqft": 1720, "carpet_sqft": 1180, "price_cr": 1.45, "price_text": "₹1.45 Cr"}
                    ]
                }
            },

            # 3. Aparna Sowparnika Rhythm of Rain (Gopanapally)
            {
                "seller_id": seller.id,
                "name": "Aparna Sowparnika Rhythm of Rain",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Gopanapally",
                "address": "Opposite Wipro SEZ Corridor, Gopanapally, Hyderabad 500046",
                "latitude": 17.4320,
                "longitude": 78.3220,
                "area": 1920.0,
                "area_unit": "sq ft",
                "road_access_m": 36.0,
                "frontage_m": 80.0,
                "survey_number": "SY-84/3",
                "asking_price": "₹1.65 Cr - ₹3.67 Cr",
                "total_price": 24000000.0,
                "payment_terms": "Construction Linked Milestone Plan",
                "additional_charges": "Car parking & Clubhouse: ₹5 Lakhs",
                "maintenance_charges": "₹4.0 / sq ft / month",
                "availability_date": "Dec 2028",
                "description": "Aparna Sowparnika Rhythm of Rain is a landmark 16.5-acre development featuring 6 grand towers with 32 floors and 2,225 premium apartments adjacent to Wipro SEZ and Financial District.",
                "amenities": ["Infinity Swimming Pool", "World-class Gym", "Double-height Clubhouse", "Tennis Courts", "Badminton Courts", "EV Charging"],
                "utilities": ["Treated Water Supply", "Solar Power Grid", "Rainwater Harvesting"],
                "floors": 32,
                "towers": 6,
                "unit_count": 2225,
                "construction_status": "Under Construction",
                "photos": [{"url": "/assets/urbanrise_the_coast.jpg", "caption": "Aparna Towers Elevation"}],
                "documents": [{"name": "TS RERA Sanction (P02400006124)", "url": "/docs/ts_rera_aparna.pdf", "tag": "ok", "size": "1.9 MB"}],
                "seller_name": "Aparna Constructions",
                "seller_contact": "+91 40 2335 2708 / sales@aparnaconstructions.com",
                "possession_date": "Dec 2028",
                "developer_profile": "Hyderabad's premier real estate builder with over 45 delivered landmark communities.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 420,
                "modules_data": {
                    "base_rate": 12500.0,
                    "unitSizeRange": "1,320–2,935",
                    "configurations": [
                        {"bhk": 2, "name": "2 BHK Grand", "sbu_sqft": 1320, "carpet_sqft": 920, "price_cr": 1.65, "price_text": "₹1.65 Cr"},
                        {"bhk": 3, "name": "3 BHK Royal", "sbu_sqft": 1920, "carpet_sqft": 1340, "price_cr": 2.40, "price_text": "₹2.40 Cr"},
                        {"bhk": 4, "name": "4 BHK Sky Suite", "sbu_sqft": 2935, "carpet_sqft": 2050, "price_cr": 3.67, "price_text": "₹3.67 Cr"}
                    ]
                }
            },

            # 4. Aurelia Heights (Puppalaguda)
            {
                "seller_id": seller.id,
                "name": "Aurelia Heights",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Puppalaguda",
                "address": "Golden Mile Road, Puppalaguda, Hyderabad 500089",
                "latitude": 17.4080,
                "longitude": 78.3650,
                "area": 1650.0,
                "area_unit": "sq ft",
                "road_access_m": 24.0,
                "frontage_m": 55.0,
                "survey_number": "SY-310/2",
                "asking_price": "₹1.58 – 2.30 Cr",
                "total_price": 19400000.0,
                "payment_terms": "20:80 Bank Approved Scheme",
                "additional_charges": "Clubhouse & Parking: ₹4.5 Lakhs",
                "maintenance_charges": "₹4.0 / sq ft / month",
                "availability_date": "Mar 2028",
                "description": "Aurelia Heights brings high-density luxury living to Puppalaguda with 4 towers, 28 floors, 820 homes, and just 14 mins commute to HITEC City.",
                "amenities": ["Swimming Pool", "Gym", "Clubhouse", "Squash Court", "EV Charging"],
                "utilities": ["Municipal Water Supply", "100% Power Backup", "STP"],
                "floors": 28,
                "towers": 4,
                "unit_count": 820,
                "construction_status": "Under Construction",
                "photos": [{"url": "/assets/mvv_mk_park.jpg", "caption": "Aurelia Heights Entrance"}],
                "documents": [{"name": "RERA Registration Certificate", "url": "/docs/ts_rera_aurelia.pdf", "tag": "ok", "size": "1.3 MB"}],
                "seller_name": "Aurelia Developers",
                "seller_contact": "+91 40 4910 3300 / contact@aureliadevelopers.com",
                "possession_date": "Mar 2028",
                "developer_profile": "Urban luxury builder focused on prime corridors near HITEC City.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 215,
                "modules_data": {
                    "base_rate": 9900.0,
                    "unitSizeRange": "1,140–1,720",
                    "configurations": [
                        {"bhk": 3, "name": "3 BHK Elite", "sbu_sqft": 1650, "carpet_sqft": 1140, "price_cr": 1.58, "price_text": "₹1.58 Cr"},
                        {"bhk": 4, "name": "4 BHK Signature", "sbu_sqft": 2320, "carpet_sqft": 1720, "price_cr": 2.30, "price_text": "₹2.30 Cr"}
                    ]
                }
            },

            # 5. Sattva Greenwood (Kokapet)
            {
                "seller_id": seller.id,
                "name": "Sattva Greenwood",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Kokapet",
                "address": "Neopolis Access Corridor, Kokapet, Hyderabad 500075",
                "latitude": 17.4110,
                "longitude": 78.3320,
                "area": 1585.0,
                "area_unit": "sq ft",
                "road_access_m": 36.0,
                "frontage_m": 65.0,
                "survey_number": "SY-19/A",
                "asking_price": "₹1.52 – 2.65 Cr",
                "total_price": 20800000.0,
                "payment_terms": "Immediate payment with ready registration",
                "additional_charges": "Car parking & Clubhouse: ₹5 Lakhs",
                "maintenance_charges": "₹4.5 / sq ft / month",
                "availability_date": "Immediate",
                "description": "Sattva Greenwood is a ready-to-move 11-acre luxury enclave in Kokapet near Neopolis featuring 5 towers, 30 floors, 74% open green space, and OC received status.",
                "amenities": ["Olympic Length Pool", "Grand Clubhouse", "Indoor Badminton", "Gym", "EV Charging", "Power Backup"],
                "utilities": ["Municipal Water Supply", "Full DG Backup", "Rainwater Harvesting"],
                "floors": 30,
                "towers": 5,
                "unit_count": 1150,
                "construction_status": "Ready to Move",
                "photos": [{"url": "/assets/ramez_seapoint.jpg", "caption": "Sattva Greenwood Completed Tower"}],
                "documents": [{"name": "Occupancy Certificate (OC)", "url": "/docs/oc_sattva.pdf", "tag": "ok", "size": "2.1 MB"}],
                "seller_name": "Sattva Group",
                "seller_contact": "+91 40 2314 9900 / hyderabad@sattvagroup.in",
                "possession_date": "Ready to Move",
                "developer_profile": "Nationwide real estate leader with over 60 million sq ft of completed developments.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 290,
                "modules_data": {
                    "base_rate": 10800.0,
                    "unitSizeRange": "1,095–1,980",
                    "configurations": [
                        {"bhk": 3, "name": "3 BHK Luxury", "sbu_sqft": 1585, "carpet_sqft": 1095, "price_cr": 1.52, "price_text": "₹1.52 Cr"},
                        {"bhk": 4, "name": "4 BHK Penthouse", "sbu_sqft": 2450, "carpet_sqft": 1980, "price_cr": 2.65, "price_text": "₹2.65 Cr"}
                    ]
                }
            },

            # 6. Lakeview Residences (Narsingi)
            {
                "seller_id": seller.id,
                "name": "Lakeview Residences",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Narsingi",
                "address": "Gandipet Lake Road, Narsingi, Hyderabad 500075",
                "latitude": 17.3850,
                "longitude": 78.3490,
                "area": 1180.0,
                "area_unit": "sq ft",
                "road_access_m": 20.0,
                "frontage_m": 45.0,
                "survey_number": "SY-62/1",
                "asking_price": "₹98 L – 1.45 Cr",
                "total_price": 12150000.0,
                "payment_terms": "20% booking, 80% milestone based",
                "additional_charges": "Car parking: ₹3 Lakhs",
                "maintenance_charges": "₹3.0 / sq ft / month",
                "availability_date": "Dec 2027",
                "description": "Lakeview Residences offers tranquil lake-facing apartments across 5.4 acres with 3 towers, 22 floors, and 540 homes with direct ORR Exit 1 connectivity.",
                "amenities": ["Swimming Pool", "Gym", "Clubhouse", "Lakeview Deck", "Power Backup"],
                "utilities": ["Municipal Water Supply", "STP Plant", "Rainwater Harvesting"],
                "floors": 22,
                "towers": 3,
                "unit_count": 540,
                "construction_status": "Under Construction",
                "photos": [{"url": "/assets/sreeja_ocean_view.jpg", "caption": "Lakeview Towers Facing Water"}],
                "documents": [{"name": "TS RERA Sanction", "url": "/docs/ts_rera_lakeview.pdf", "tag": "ok", "size": "1.1 MB"}],
                "seller_name": "Lakeview Homes",
                "seller_contact": "+91 40 4120 7700 / info@lakeviewhomes.in",
                "possession_date": "Dec 2027",
                "developer_profile": "Eco-friendly waterfront community residential builders.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 160,
                "modules_data": {
                    "base_rate": 8300.0,
                    "unitSizeRange": "820–1,180",
                    "configurations": [
                        {"bhk": 2, "name": "2 BHK Lake Breeze", "sbu_sqft": 1180, "carpet_sqft": 820, "price_cr": 0.98, "price_text": "₹98 L"},
                        {"bhk": 3, "name": "3 BHK Lake Panorama", "sbu_sqft": 1720, "carpet_sqft": 1180, "price_cr": 1.45, "price_text": "₹1.45 Cr"}
                    ]
                }
            },

            # 7. Urbania Meadows (Tellapur)
            {
                "seller_id": seller.id,
                "name": "Urbania Meadows",
                "property_type": "apartment",
                "state": "Telangana",
                "district": "Rangareddy",
                "city": "Hyderabad",
                "locality": "Tellapur",
                "address": "Tellapur Tech Corridor Road, Tellapur, Hyderabad 502032",
                "latitude": 17.4720,
                "longitude": 78.2850,
                "area": 1280.0,
                "area_unit": "sq ft",
                "road_access_m": 30.0,
                "frontage_m": 60.0,
                "survey_number": "SY-204/B",
                "asking_price": "₹1.05 Cr - ₹1.85 Cr",
                "total_price": 14500000.0,
                "payment_terms": "Construction linked payment plan",
                "additional_charges": "Car parking & Clubhouse: ₹3.5 Lakhs",
                "maintenance_charges": "₹3.2 / sq ft / month",
                "availability_date": "Dec 2029",
                "description": "Urbania Meadows is an 8.2-acre master-planned residential enclave in Tellapur featuring 4 towers with 26 floors, spacious balconies, solar grids, and EV charging provisions.",
                "amenities": ["Gym", "Clubhouse", "EV Charging", "Children Play Area", "Power Backup"],
                "utilities": ["Municipal Water Supply", "100% DG Backup", "Solar Water Heating"],
                "floors": 26,
                "towers": 4,
                "unit_count": 760,
                "construction_status": "New Launch",
                "photos": [{"url": "/assets/urbanrise_the_coast.jpg", "caption": "Urbania Meadows Entrance Gate"}],
                "documents": [{"name": "TS RERA Sanction Permit", "url": "/docs/ts_rera_urbania.pdf", "tag": "ok", "size": "1.5 MB"}],
                "seller_name": "Urbania Homes Pvt Ltd",
                "seller_contact": "+91 40 4880 1122 / sales@urbaniahomes.in",
                "possession_date": "Dec 2029",
                "developer_profile": "Future-ready smart home community builders in northwest Hyderabad.",
                "verification_status": "Seller provided / Unverified",
                "status": "published",
                "is_demo": True,
                "views_count": 134,
                "modules_data": {
                    "base_rate": 8200.0,
                    "unitSizeRange": "1,280–2,190",
                    "configurations": [
                        {"bhk": 2, "name": "2 BHK Prime", "sbu_sqft": 1280, "carpet_sqft": 890, "price_cr": 1.05, "price_text": "₹1.05 Cr"},
                        {"bhk": 3, "name": "3 BHK Horizon", "sbu_sqft": 2190, "carpet_sqft": 1530, "price_cr": 1.85, "price_text": "₹1.85 Cr"}
                    ]
                }
            }
        ]

        for p_data in properties_data:
            prop = models.Property(**p_data)
            db.add(prop)

        db.commit()
        print("Successfully seeded Hyderabad properties matching portal-property.netlify.app")
