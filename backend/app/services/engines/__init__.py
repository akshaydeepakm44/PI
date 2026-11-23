from app.services.engines.models import CalcResult
from app.services.engines.assumptions import Assumption, ASSUMPTIONS_REGISTRY, get_assumption
from app.services.engines.pricing_engine import offer_skew, marginal_cost, usable_foot, true_cheque, check_floor_rise_conflict
from app.services.engines.spatial_engine import (
    density_per_floor,
    consistency,
    basement_footprint,
    straight_line_distances,
    solar_shadow,
)
from app.services.engines.commute_engine import annual_commute_hours, implied_speed
from app.services.engines.audit_engine import claim_ledger

# Four Evidence Families
from app.services.engines.world.solar_engine import (
    calculate_solar_seasons,
    calculate_tower_shadows,
    calculate_facade_sunlight,
    calculate_price_orientation_delta,
    calculate_central_green_shade,
    sun_pos,
    sunrise_hour,
    facade,
    shadow_length,
    clock
)
from app.services.engines.world.air_engine import calculate_air_quality_metrics
from app.services.engines.world.map_engine import compute_map_engine_analysis, LOCAL_OSM_POIS, NEARBY_NOISE_SOURCES
from app.services.engines.world.terrain_engine import compute_terrain_elevation_analysis, MANDATORY_DISCLAIMER

from app.services.engines.market.peer_engine import compute_peer_engine_analysis, extract_market_metrics
from app.services.engines.standout_engine import (
    calculate_property_standout_metrics,
    compute_peer_cohort_analysis,
)

from app.services.engines.record.record_source import lookup_registration, compare_record_with_builder_data
from app.services.engines.buyer.profile import BuyerProfile, DestinationPlace, HouseholdInfo, parse_buyer_profile, VALID_PRIORITIES
from app.services.engines.config.advisor_weights import (
    MATERIALITY_WEIGHTS,
    CONFIDENCE_TIERS,
    calculate_materiality
)

__all__ = [
    "CalcResult",
    "Assumption",
    "ASSUMPTIONS_REGISTRY",
    "get_assumption",
    "offer_skew",
    "marginal_cost",
    "usable_foot",
    "true_cheque",
    "check_floor_rise_conflict",
    "density_per_floor",
    "consistency",
    "basement_footprint",
    "straight_line_distances",
    "solar_shadow",
    "annual_commute_hours",
    "implied_speed",
    "claim_ledger",
    "calculate_solar_seasons",
    "calculate_tower_shadows",
    "calculate_facade_sunlight",
    "calculate_price_orientation_delta",
    "calculate_central_green_shade",
    "calculate_air_quality_metrics",
    "compute_map_engine_analysis",
    "LOCAL_OSM_POIS",
    "NEARBY_NOISE_SOURCES",
    "compute_terrain_elevation_analysis",
    "MANDATORY_DISCLAIMER",
    "compute_peer_engine_analysis",
    "extract_market_metrics",
    "calculate_property_standout_metrics",
    "compute_peer_cohort_analysis",
    "lookup_registration",
    "compare_record_with_builder_data",
    "BuyerProfile",
    "DestinationPlace",
    "HouseholdInfo",
    "parse_buyer_profile",
    "VALID_PRIORITIES",
    "MATERIALITY_WEIGHTS",
    "CONFIDENCE_TIERS",
    "calculate_materiality"
]
