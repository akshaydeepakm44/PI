export type UserRole = 'seller' | 'buyer' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PropertyPhoto {
  url: string;
  caption?: string;
}

export interface PropertyDocument {
  name: string;
  url: string;
  tag?: 'ok' | 'warn' | 'info';
  size?: string;
}

export interface Property {
  id: number;
  seller_id: number;
  name: string;
  property_type: 'apartment' | 'villa' | 'residential_plot' | 'agricultural_land' | 'commercial';
  state: string;
  district: string;
  city: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  area: number;
  area_unit: string;
  road_access_m?: number | null;
  frontage_m?: number | null;
  survey_number?: string | null;
  boundary_geojson?: Record<string, any> | null;
  asking_price: string;
  price_unit: string;
  total_price?: number | null;
  rate_per_sqft?: number | null;
  payment_terms?: string | null;
  additional_charges?: string | null;
  maintenance_charges?: string | null;
  availability_date: string;
  description: string;
  amenities: string[];
  utilities: string[];
  floors?: number | null;
  towers?: number | null;
  unit_count?: number | null;
  construction_status: string;
  photos: PropertyPhoto[];
  site_plan_url?: string | null;
  brochure_url?: string | null;
  survey_sketch_url?: string | null;
  documents: PropertyDocument[];
  seller_name: string;
  seller_contact: string;
  possession_date: string;
  developer_profile?: string | null;
  verification_status: string;
  status: 'draft' | 'published' | 'suspended';
  is_demo: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: number;
  property_id: number;
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  message: string;
  seller_reply?: string | null;
  status: 'pending' | 'responded';
  created_at: string;
  updated_at: string;
  property_name?: string;
}

export interface WishlistItem {
  id: number;
  property_id: number;
  created_at: string;
  property?: Property;
}

export interface AIAssistanceSection {
  title: string;
  status: string;
  content: string;
  confidence?: string | null;
  evidence_points: string[];
}

export interface AIAssistanceReport {
  property_id: number;
  property_name: string;
  status_label: string;
  connected_in_phase_2: boolean;
  executive_summary: AIAssistanceSection;
  neighbourhood: AIAssistanceSection;
  connectivity: AIAssistanceSection;
  liveability: AIAssistanceSection;
  my_commute: AIAssistanceSection;
  price_context: AIAssistanceSection;
  strengths_limitations: AIAssistanceSection;
  missing_information: AIAssistanceSection;
  evidence_metadata: Record<string, any>;
}

export interface AdminOverview {
  total_listings: number;
  published_listings: number;
  draft_listings: number;
  suspended_listings: number;
  total_users: number;
  total_enquiries: number;
  open_quality_issues: number;
  active_research_jobs: number;
}

export interface ResearchJob {
  id: number;
  property_id: number;
  job_type: string;
  status: 'queued' | 'in_progress' | 'completed' | 'partially_completed' | 'failed';
  result_summary?: string | null;
  error_message?: string | null;
  execution_time_ms?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  status: 'healthy' | 'degraded' | 'offline';
  latency_ms: number;
  last_checked: string;
}

export interface DataQualityIssue {
  id: number;
  property_id: number;
  severity: 'low' | 'medium' | 'high';
  issue_description: string;
  status: 'open' | 'resolved';
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  target_type: string;
  target_id?: number | null;
  details?: string | null;
  created_at: string;
}

// --- PHASE 2 LOCATION INTELLIGENCE TYPES ---

export interface GeocodingResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  display_name: string;
  latitude: number;
  longitude: number;
  category?: string;
  type?: string;
  importance?: number;
  address?: {
    road?: string;
    neighbourhood?: string;
    locality?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface RouteResult {
  status: 'success' | 'unreachable' | 'error';
  provider: string;
  destination_name: string;
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  road_distance_km: number | null;
  straight_line_distance_km: number;
  tortuosity_ratio: number;
  estimated_duration_mins: number | null;
  route_geometry: [number, number][] | null; // array of [lon, lat] pairs
  traffic_aware: boolean;
  disclaimer: string;
  calculated_at?: string;
  error_message?: string;
}

export interface NearbyPOI {
  id: number;
  osm_id: number;
  name: string;
  has_custom_name: boolean;
  category: string;
  type: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  distance_km: number;
  distance_tier: 'under_1km' | '1_to_3km' | '3_to_5km' | '5_to_10km';
  osm_url: string;
}

export interface PollutantMetric {
  code: string;
  label: string;
  value: number | null;
  unit: string;
  who_guideline: number;
  status: string;
  color: 'emerald' | 'amber' | 'rose';
  percentage_of_limit: number;
}

export interface AirQualityData {
  status: 'available' | 'unavailable';
  provider: string;
  observation_time?: string;
  retrieved_at: string;
  location?: {
    latitude: number;
    longitude: number;
    elevation_meters?: number;
  };
  us_aqi: number | null;
  european_aqi?: number | null;
  category: string;
  color_theme: 'emerald' | 'amber' | 'orange' | 'rose' | 'purple' | 'red' | 'slate';
  health_advice?: string;
  pollutants: PollutantMetric[];
  hourly_trend?: { hour: string; aqi: number; pm25: number }[];
  methodology_disclaimer?: string;
  licensing?: string;
  reason?: string;
}

export interface PropertyIntelligenceDossier {
  property_id: number;
  property_name: string;
  coordinates: { lat: number; lon: number };
  status: 'completed' | 'partially_completed' | 'queued' | 'failed';
  last_researched_at: string | null;
  geocoding?: any;
  nearby_pois?: Record<string, NearbyPOI[]>;
  poi_summary?: Record<string, { total: number; closest_meters: number | null; closest_name: string | null }>;
  air_quality?: AirQualityData;
  connectivity?: {
    routes: {
      name: string;
      type: string;
      road_distance_km: number;
      straight_line_distance_km: number;
      estimated_duration_mins: number;
      tortuosity_ratio: number;
      route_geometry?: [number, number][];
    }[];
  };
  source_metadata?: {
    execution_time_ms: number;
    providers_contacted: string[];
    successful_providers: number;
    pipeline_version: string;
    last_checked: string;
  };
  error_details?: string | null;
  disclaimer: string;
}

// --- PHASE 3: AI PROPERTY INTELLIGENCE ENGINE TYPES ---

export type EvidenceCategory =
  | 'seller_fact'
  | 'location_spatial'
  | 'environmental'
  | 'calculated'
  | 'evidence_gap';

export type ReliabilityLevel = 'high' | 'moderate' | 'unverified' | 'gap';

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  label: string;
  value: any;
  unit?: string | null;
  provenance: string;
  retrieved_at: string;
  limitations?: string | null;
  reliability: ReliabilityLevel;
}

export interface PropertyEvidenceLayer {
  property_id: number;
  property_name: string;
  research_status: string;
  evidence_count: number;
  as_of_timestamp: string;
  items: Record<string, EvidenceItem>;
}

export interface BuyerPreferences {
  budget_max?: number | null;
  intended_use?: 'self_occupation' | 'family_home' | 'investment' | 'rental' | string;
  preferred_commute_destination?: string | null;
  commute_tolerance_mins?: number;
  priorities?: {
    schools?: number;
    transit?: number;
    healthcare?: number;
    air_quality?: number;
    daily_needs?: number;
  };
  preferred_property_type?: string | null;
}

export interface EvidenceClaim {
  claim: string;
  evidence_ids: string[];
}

export interface AmenityCategoryBreakdown {
  category: string;
  count: number;
  closest_meters?: number | null;
  closest_name?: string | null;
  practical_utility: string;
  evidence_ids: string[];
}

export interface RouteEvaluation {
  destination: string;
  road_distance_km?: number | null;
  straight_line_km?: number | null;
  estimated_duration_mins?: number | null;
  tortuosity_ratio?: number | null;
  connectivity_verdict: string;
  evidence_ids: string[];
}

export interface PollutantCompliance {
  pollutant: string;
  concentration?: number | null;
  unit: string;
  who_guideline: number;
  status: string;
  evidence_ids: string[];
}

export interface SuitabilityProfile {
  profile_name: string;
  fit_score: number;
  fit_level: 'High' | 'Moderate' | 'Conditional' | 'Low' | string;
  fit_rationale: string;
  key_tradeoffs: string[];
  evidence_ids: string[];
}

export interface DueDiligenceQuestion {
  topic: string;
  question_to_ask_seller: string;
  verification_source: string;
  evidence_gap_id: string;
}

export interface MissingEvidenceItem {
  item_name: string;
  impact: 'high' | 'medium' | 'low';
  why_it_matters: string;
  evidence_gap_id: string;
}

export interface PersonalizedBuyerAssessment {
  buyer_preferences_snapshot: BuyerPreferences;
  intended_use_evaluation: string;
  budget_evaluation: string;
  commute_evaluation: string;
  decision_aid_score: number;
  scoring_components: {
    dimension: string;
    weight_percent: number;
    component_score: number;
    explanation: string;
  }[];
  score_methodology_disclaimer: string;
}

export interface PropertyIntelligenceReport {
  executive_assessment: {
    summary: string;
    evidence_backed_advantages: EvidenceClaim[];
    disadvantages_and_tradeoffs: EvidenceClaim[];
    ideal_buyer_summary: string;
    critical_unresolved_questions: string[];
  };
  location_and_daily_life: {
    summary: string;
    amenity_breakdown: AmenityCategoryBreakdown[];
    spatial_convenience_verdict: string;
    coverage_limitations_explained: string;
    evidence_ids: string[];
  };
  connectivity_and_commute: {
    summary: string;
    route_evaluations: RouteEvaluation[];
    traffic_uncertainty_note: string;
    evidence_ids: string[];
  };
  environmental_assessment: {
    summary: string;
    aqi_reading?: number | null;
    aqi_category: string;
    who_pollutant_compliance: PollutantCompliance[];
    model_vs_hyperlocal_disclaimer: string;
    evidence_ids: string[];
  };
  price_and_value_context: {
    summary: string;
    rate_per_sqft?: number | string | null;
    comparables_context: string;
    valuation_disclaimer: string;
    evidence_ids: string[];
  };
  buyer_suitability_profiles: SuitabilityProfile[];
  due_diligence_checklist: DueDiligenceQuestion[];
  missing_evidence_audit: MissingEvidenceItem[];
  personalized_buyer_assessment?: PersonalizedBuyerAssessment;
  evidence_citations_audit?: {
    total_citations_analyzed: number;
    valid_citations_verified: number;
    hallucinated_citations_pruned: number;
    pruned_id_sample: string[];
    numerical_corrections_made?: number;
    numerical_corrections_sample?: string[];
    audit_pass: boolean;
  };
}

export interface PropertyReportResponse {
  report_id: number;
  property_id: number;
  property_name: string;
  status: string;
  is_stale: boolean;
  model_name: string;
  prompt_version: string;
  created_at: string;
  execution_time_ms: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
  preferences_applied?: BuyerPreferences | null;
  evidence_snapshot: PropertyEvidenceLayer;
  report: PropertyIntelligenceReport;
}

export interface PropertyComparisonMatrixItem {
  id: number;
  name: string;
  locality: string;
  property_type: string;
  asking_price: string;
  total_price: number;
  area: number;
  area_unit: string;
  rate_per_sqft?: number | null;
  construction_status: string;
  routes: Record<string, {
    road_distance_km?: number | null;
    estimated_duration_mins?: number | null;
    straight_line_distance_km?: number | null;
    tortuosity_ratio?: number | null;
  }>;
  air_quality: {
    us_aqi?: number | null;
    category: string;
    scale: string;
  };
  amenities_count: Record<string, number>;
  evidence_count: number;
  research_status: string;
  evidence_snapshot_id: string;
}

export interface PropertyComparisonResponse {
  properties: PropertyComparisonMatrixItem[];
  comparison_matrix: {
    attributes: { key: string; label: string; unit?: string }[];
  };
  tradeoffs_summary: string[];
  persona_recommendations: {
    persona: string;
    recommended_property_id: number;
    rationale: string;
  }[];
  buyer_preferences_applied?: BuyerPreferences | null;
  disclaimer: string;
}

