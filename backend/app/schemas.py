from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import datetime

# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "buyer" # seller, buyer, admin

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class DemoLoginRequest(BaseModel):
    role: str = "buyer" # seller, buyer, admin


# --- Property Schemas ---
class PropertyBase(BaseModel):
    # A. Identity
    name: str
    property_type: str # apartment, villa, residential_plot, agricultural_land, commercial
    state: str = "Andhra Pradesh"
    district: str = "Visakhapatnam"
    city: str = "Visakhapatnam"
    locality: str
    address: str
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")
    area: float
    area_unit: str = "sq ft"
    road_access_m: Optional[float] = None
    frontage_m: Optional[float] = None
    survey_number: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None

    # B. Pricing
    asking_price: str
    price_unit: str = "INR"
    total_price: Optional[float] = None
    payment_terms: Optional[str] = None
    additional_charges: Optional[str] = None
    maintenance_charges: Optional[str] = None
    availability_date: str = "Immediate"

    # C. Details
    description: str
    amenities: List[str] = []
    utilities: List[str] = []
    floors: Optional[int] = None
    towers: Optional[int] = None
    unit_count: Optional[int] = None
    construction_status: str = "Ready to Move"

    # D. Evidence
    photos: List[Dict[str, Any]] = []
    site_plan_url: Optional[str] = None
    brochure_url: Optional[str] = None
    survey_sketch_url: Optional[str] = None
    documents: List[Dict[str, Any]] = []

    # E. Seller Information
    seller_name: str
    seller_contact: str
    possession_date: str = "Immediate"
    developer_profile: Optional[str] = None
    modules_data: Optional[Dict[str, Any]] = None

    # Status
    status: str = "published" # draft, published

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    property_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    area: Optional[float] = None
    area_unit: Optional[str] = None
    road_access_m: Optional[float] = None
    frontage_m: Optional[float] = None
    survey_number: Optional[str] = None
    asking_price: Optional[str] = None
    total_price: Optional[float] = None
    payment_terms: Optional[str] = None
    additional_charges: Optional[str] = None
    maintenance_charges: Optional[str] = None
    availability_date: Optional[str] = None
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    utilities: Optional[List[str]] = None
    floors: Optional[int] = None
    towers: Optional[int] = None
    unit_count: Optional[int] = None
    construction_status: Optional[str] = None
    photos: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    modules_data: Optional[Dict[str, Any]] = None
    seller_name: Optional[str] = None
    seller_contact: Optional[str] = None
    possession_date: Optional[str] = None
    developer_profile: Optional[str] = None
    status: Optional[str] = None

class PropertyOut(PropertyBase):
    id: int
    seller_id: int
    verification_status: str
    is_demo: bool
    views_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# --- Enquiry Schemas ---
class EnquiryCreate(BaseModel):
    property_id: int
    buyer_name: str
    buyer_email: EmailStr
    buyer_phone: Optional[str] = None
    message: str

class EnquiryReply(BaseModel):
    reply: str

class EnquiryOut(BaseModel):
    id: int
    property_id: int
    buyer_id: int
    buyer_name: str
    buyer_email: str
    buyer_phone: Optional[str] = None
    message: str
    seller_reply: Optional[str] = None
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    property_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Wishlist Schemas ---
class WishlistOut(BaseModel):
    id: int
    property_id: int
    created_at: datetime.datetime
    property: Optional[PropertyOut] = None

    model_config = ConfigDict(from_attributes=True)


# --- Admin Schemas ---
class ListingStatusUpdate(BaseModel):
    status: str # published, suspended, draft
    reason: Optional[str] = None

class AdminOverviewOut(BaseModel):
    total_listings: int
    published_listings: int
    draft_listings: int
    suspended_listings: int
    total_users: int
    total_enquiries: int
    open_quality_issues: int
    active_research_jobs: int
    live_sources: Optional[List[Dict[str, Any]]] = None
    evidence_stats: Optional[Dict[str, Any]] = None
    environmental_telemetry: Optional[List[Dict[str, Any]]] = None
    portfolio_valuation_inr: Optional[float] = None
    average_rate_per_sqft: Optional[float] = None

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    target_type: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ResearchJobOut(BaseModel):
    id: int
    property_id: int
    job_type: str
    status: str
    result_summary: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class DataSourceOut(BaseModel):
    id: int
    name: str
    source_type: str
    status: str
    latency_ms: int
    last_checked: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class DataQualityIssueOut(BaseModel):
    id: int
    property_id: int
    severity: str
    issue_description: str
    status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# --- AI Assistance Typed Interface Placeholder ---
class AIAssistanceSection(BaseModel):
    title: str
    status: str = "placeholder" # placeholder, active
    content: str
    confidence: Optional[str] = None
    evidence_points: List[str] = []

class AIAssistanceResponse(BaseModel):
    property_id: int
    property_name: str
    status_label: str = "Location intelligence will be connected in Phase 2"
    connected_in_phase_2: bool = True
    executive_summary: AIAssistanceSection
    neighbourhood: AIAssistanceSection
    connectivity: AIAssistanceSection
    liveability: AIAssistanceSection
    my_commute: AIAssistanceSection
    price_context: AIAssistanceSection
    strengths_limitations: AIAssistanceSection
    missing_information: AIAssistanceSection
    evidence_metadata: Dict[str, Any]


# --- PHASE 3: AI PROPERTY INTELLIGENCE ENGINE SCHEMAS ---

class BuyerPreferencesInput(BaseModel):
    budget_max: Optional[float] = None
    intended_use: Optional[str] = "self_occupation" # self_occupation, family_home, investment, rental
    preferred_commute_destination: Optional[str] = None
    commute_tolerance_mins: Optional[int] = 30
    priorities: Optional[Dict[str, int]] = Field(default_factory=dict) # e.g. {"schools": 5, "transit": 4, "healthcare": 4, "air_quality": 3}
    preferred_property_type: Optional[str] = None

class GenerateReportRequest(BaseModel):
    buyer_preferences: Optional[BuyerPreferencesInput] = None
    force_refresh: bool = False

class ComparePropertiesRequest(BaseModel):
    property_ids: List[int] = Field(..., min_length=2, max_length=4)
    buyer_preferences: Optional[BuyerPreferencesInput] = None

