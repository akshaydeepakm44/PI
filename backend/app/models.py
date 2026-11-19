import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="buyer") # "seller", "buyer", "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    properties = relationship("Property", back_populates="seller", cascade="all, delete-orphan")
    enquiries_sent = relationship("Enquiry", back_populates="buyer", foreign_keys="Enquiry.buyer_id")
    wishlists = relationship("Wishlist", back_populates="buyer", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # A. Property identity
    name = Column(String(255), nullable=False, index=True)
    property_type = Column(String(50), nullable=False, index=True) # apartment, villa, residential_plot, agricultural_land, commercial
    state = Column(String(100), default="Andhra Pradesh")
    district = Column(String(100), default="Visakhapatnam")
    city = Column(String(100), default="Visakhapatnam", index=True)
    locality = Column(String(100), nullable=False, index=True)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area = Column(Float, nullable=False)
    area_unit = Column(String(50), default="sq ft")
    road_access_m = Column(Float, nullable=True) # road frontage / access width in meters
    frontage_m = Column(Float, nullable=True)
    survey_number = Column(String(100), nullable=True)
    boundary_geojson = Column(JSON, nullable=True)

    # B. Pricing
    asking_price = Column(String(100), nullable=False) # e.g. "75 L - 1.2 Cr" or "85 Lakhs"
    price_unit = Column(String(50), default="INR")
    total_price = Column(Float, nullable=True) # Normalized numeric for sorting/filtering
    payment_terms = Column(String(255), nullable=True)
    additional_charges = Column(String(255), nullable=True)
    maintenance_charges = Column(String(255), nullable=True)
    availability_date = Column(String(100), default="Immediate")
    last_updated_date = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # C. Property details
    description = Column(Text, nullable=False)
    amenities = Column(JSON, default=list) # List of amenity strings
    utilities = Column(JSON, default=list) # Power backup, water supply, sewage, etc.
    floors = Column(Integer, nullable=True)
    towers = Column(Integer, nullable=True)
    unit_count = Column(Integer, nullable=True)
    construction_status = Column(String(100), default="Ready to Move") # Under Construction, Ready to Move, etc.

    # D. Evidence
    photos = Column(JSON, default=list) # List of {"url": ..., "caption": ...}
    site_plan_url = Column(String(500), nullable=True)
    brochure_url = Column(String(500), nullable=True)
    survey_sketch_url = Column(String(500), nullable=True)
    documents = Column(JSON, default=list) # List of {"name": ..., "url": ..., "tag": ..., "size": ...}

    # E. Seller / Project Information
    seller_name = Column(String(255), nullable=False)
    seller_contact = Column(String(255), nullable=False)
    possession_date = Column(String(100), default="Immediate")
    developer_profile = Column(Text, nullable=True)

    # Verification & Publishing Controls
    verification_status = Column(String(100), default="Seller provided / Unverified")
    status = Column(String(50), default="published", index=True) # draft, published, suspended
    is_demo = Column(Boolean, default=False, index=True)
    views_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    seller = relationship("User", back_populates="properties")
    enquiries = relationship("Enquiry", back_populates="property", cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="property", cascade="all, delete-orphan")
    research_jobs = relationship("ResearchJob", back_populates="property", cascade="all, delete-orphan")
    quality_issues = relationship("DataQualityIssue", back_populates="property", cascade="all, delete-orphan")
    research = relationship("PropertyResearch", back_populates="property", uselist=False, cascade="all, delete-orphan")
    intelligence_reports = relationship("PropertyIntelligenceReport", back_populates="property", cascade="all, delete-orphan")


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    buyer_name = Column(String(255), nullable=False)
    buyer_email = Column(String(255), nullable=False)
    buyer_phone = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    seller_reply = Column(Text, nullable=True)
    status = Column(String(50), default="pending") # pending, responded
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="enquiries")
    buyer = relationship("User", back_populates="enquiries_sent", foreign_keys=[buyer_id])


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    buyer = relationship("User", back_populates="wishlists")
    property = relationship("Property", back_populates="wishlists")


class ResearchJob(Base):
    __tablename__ = "research_jobs"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    job_type = Column(String(100), default="Spatial Context & POI Discovery")
    status = Column(String(50), default="queued") # queued, in_progress, completed, failed
    result_summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="research_jobs")


class PropertyResearch(Base):
    __tablename__ = "property_research"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), unique=True, nullable=False, index=True)
    status = Column(String(50), default="queued") # queued, in_progress, completed, partially_completed, failed
    
    # Reverse geocoding & address verification
    geocoding_data = Column(JSON, nullable=True)
    
    # Overpass POI discovery across categories & radii
    nearby_pois = Column(JSON, nullable=True)
    poi_summary = Column(JSON, nullable=True)
    
    # Air quality observations & pollutant breakdown
    air_quality_data = Column(JSON, nullable=True)
    
    # Connectivity metrics & key transit routes
    connectivity_data = Column(JSON, nullable=True)
    
    # Metadata, source timestamps & freshness
    source_metadata = Column(JSON, nullable=True)
    error_details = Column(Text, nullable=True)
    last_researched_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="research")


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(100), nullable=False) # e.g. "OpenStreetMap Nominatim", "Open-Meteo Air Quality"
    status = Column(String(50), default="healthy") # healthy, degraded, offline
    latency_ms = Column(Integer, default=140)
    last_checked = Column(DateTime, default=datetime.datetime.utcnow)


class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    severity = Column(String(50), default="medium") # low, medium, high
    issue_description = Column(Text, nullable=False)
    status = Column(String(50), default="open") # open, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="quality_issues")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False) # e.g. "PROPERTY_CREATED", "STATUS_SUSPENDED", "ENQUIRY_SUBMITTED"
    target_type = Column(String(100), nullable=False) # e.g. "Property", "User", "Enquiry"
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class PropertyIntelligenceReport(Base):
    __tablename__ = "intelligence_reports"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Evidence & Prompt Versioning
    research_version = Column(String(100), nullable=True) # e.g. "v2-20261022T062000"
    prompt_version = Column(String(50), default="v3.0.0-buyer-analyst")
    model_name = Column(String(100), default="current-model")
    
    # Input snapshots
    evidence_snapshot = Column(JSON, nullable=False) # Full structured evidence layer with stable IDs
    preferences_snapshot = Column(JSON, nullable=True) # Buyer profile preferences (budget, commute, etc.)
    
    # Validated Output & Integrity
    report_json = Column(JSON, nullable=False) # Validated structured report matching Pydantic schema
    status = Column(String(50), default="completed") # completed, partial, failed, stale
    validation_status = Column(String(50), default="valid") # valid, repaired, invalid
    validation_notes = Column(JSON, nullable=True) # List of validation notices or repaired citations
    
    # Operational metrics
    execution_time_ms = Column(Integer, default=0)
    token_usage = Column(JSON, nullable=True) # {"prompt_tokens": ..., "completion_tokens": ..., "total_tokens": ...}
    is_stale = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="intelligence_reports")
    buyer = relationship("User")

