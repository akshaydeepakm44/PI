from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class Assumption:
    id: str
    value: Any
    unit: str
    reason: str
    source_note: str
    verified: bool = False

ASSUMPTIONS_REGISTRY: Dict[str, Assumption] = {
    "cars_per_home": Assumption(
        id="cars_per_home",
        value=1.0,
        unit="slots/home",
        reason="Residential parking slot allocation baseline",
        source_note="analyst assumption (owner: planning-analyst)",
        verified=False
    ),
    "sqm_per_parking_slot": Assumption(
        id="sqm_per_parking_slot",
        value=30.0,
        unit="sq m",
        reason="Parking stall allocation baseline including circulation and ramps",
        source_note="analyst assumption (owner: planning-analyst)",
        verified=False
    ),
    "working_days_per_year": Assumption(
        id="working_days_per_year",
        value=250,
        unit="days/year",
        reason="Corporate office working days calendar baseline",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
    "hours_per_work_week": Assumption(
        id="hours_per_work_week",
        value=40.0,
        unit="hours/week",
        reason="Standard corporate working week duration baseline",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
    "school_days_per_year": Assumption(
        id="school_days_per_year",
        value=200,
        unit="days/year",
        reason="Annual instructional days in primary/secondary school calendar",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
    "college_days_per_year": Assumption(
        id="college_days_per_year",
        value=220,
        unit="days/year",
        reason="Annual academic and working days for higher education campus",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
    "floor_height_m": Assumption(
        id="floor_height_m",
        value=3.0,
        unit="meters",
        reason="Residential floor slab-to-slab clear height baseline",
        source_note="analyst assumption (owner: architecture-analyst)",
        verified=False
    ),
    "plan_north_bearing": Assumption(
        id="plan_north_bearing",
        value=0.0,
        unit="degrees",
        reason="Architectural site plan north rotation relative to true north",
        source_note="analyst assumption (owner: architecture-analyst)",
        verified=False
    ),
    "peer_min_count": Assumption(
        id="peer_min_count",
        value=5,
        unit="count",
        reason="Minimum peer cohort size required to compute comparative ranks and superlatives",
        source_note="analyst assumption (owner: market-analyst)",
        verified=False
    ),
    "cpcb_aqi_breakpoints": Assumption(
        id="cpcb_aqi_breakpoints",
        value={
            "Good": {"aqi": [0, 50], "pm2_5": [0, 30]},
            "Satisfactory": {"aqi": [51, 100], "pm2_5": [31, 60]},
            "Moderate": {"aqi": [101, 200], "pm2_5": [61, 90]},
            "Poor": {"aqi": [201, 300], "pm2_5": [91, 120]},
            "Very Poor": {"aqi": [301, 400], "pm2_5": [121, 250]},
            "Severe": {"aqi": [401, 500], "pm2_5": [250, 1000]}
        },
        unit="lookup_table",
        reason="CPCB India AQI category concentration thresholds",
        source_note="CPCB AQI breakpoints; to be checked against the CPCB document",
        verified=False
    ),
    "trips_per_school_day": Assumption(
        id="trips_per_school_day",
        value=4,
        unit="trips/day",
        reason="Two return journeys daily: morning drop-off and afternoon pick-up for school child",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
    "trips_per_work_day": Assumption(
        id="trips_per_work_day",
        value=2,
        unit="trips/day",
        reason="One return journey daily between home and workplace / campus",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
    "premiums_apply": Assumption(
        id="premiums_apply",
        value=True,
        unit="boolean",
        reason="Scenario assumption: evaluates price impact if both facing and view premiums apply to the unit",
        source_note="analyst assumption (owner: pricing-analyst)",
        verified=False
    ),
    "scenario_floor_rise_rate_25": Assumption(
        id="scenario_floor_rise_rate_25",
        value=25.0,
        unit="INR/sqft",
        reason="Scenario assumption: evaluates pricing under the ₹25/sqft floor rise rate stated in pricing_breakdown",
        source_note="analyst assumption (owner: pricing-analyst)",
        verified=False
    ),
    "scenario_floor_rise_rate_50": Assumption(
        id="scenario_floor_rise_rate_50",
        value=50.0,
        unit="INR/sqft",
        reason="Scenario assumption: evaluates pricing under the ₹50/sqft floor rise rate stated in additional_charges",
        source_note="analyst assumption (owner: pricing-analyst)",
        verified=False
    ),
    "college_commute_scenario": Assumption(
        id="college_commute_scenario",
        value=True,
        unit="boolean",
        reason="Scenario assumption: adult student or faculty commuting to higher education institution (2 trips/day, 220 days/year)",
        source_note="analyst assumption (owner: commute-analyst)",
        verified=False
    ),
}

def get_assumption(assumption_id: str, overrides: Optional[Dict[str, Any]] = None) -> Assumption:
    """Retrieve an assumption by ID, applying any per-request overrides."""
    if assumption_id not in ASSUMPTIONS_REGISTRY:
        raise KeyError(f"Assumption '{assumption_id}' not found in registry")
    
    base = ASSUMPTIONS_REGISTRY[assumption_id]
    if overrides and assumption_id in overrides:
        return Assumption(
            id=base.id,
            value=overrides[assumption_id],
            unit=base.unit,
            reason=f"{base.reason} (user overridden)",
            source_note=base.source_note,
            verified=base.verified
        )
    return base
