from typing import Any, Dict, Optional
from app.services.engines.models import CalcResult
from app.services.engines.assumptions import get_assumption

def annual_commute_hours(
    one_way_minutes: Optional[float],
    destination_type: str = "office",
    trips_per_day: Optional[int] = None,
    days_per_year: Optional[int] = None,
    assumptions_override: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    Converts one-way minutes into total annual commute hours based on destination type.
    Strict dimensional formula:
      annual_hours = (one_way_minutes * trips_per_day * days_per_year) / 60
    Distance (km) is NOT part of the product.

    Destination type models:
      - office: trips_per_work_day=2, working_days_per_year=250 -> (mins * 2 * 250) / 60
      - school (child attending school): trips_per_school_day=4 (drop-off + pick-up), school_days_per_year=200 -> (mins * 4 * 200) / 60
      - college / higher_education (e.g. ISB): trips_per_work_day=2, college_days_per_year=220 -> (mins * 2 * 220) / 60 (labelled scenario)
      - other: requires explicit buyer transit scenario or data_gap
    """
    inputs = {
        "one_way_minutes": one_way_minutes,
        "destination_type": destination_type,
        "trips_per_day": trips_per_day,
        "days_per_year": days_per_year
    }
    if one_way_minutes is None:
        return CalcResult(
            id="annual_commute_hours",
            value=None,
            formula_text="annual_hours = (one_way_minutes * trips_per_day * days_per_year) / 60",
            inputs=inputs,
            missing_inputs=["one_way_minutes"]
        )

    assumptions_used = []
    dest_lower = destination_type.lower()

    # Resolve trips per day
    resolved_trips = trips_per_day
    if resolved_trips is None:
        if dest_lower == "school":
            t_assump = get_assumption("trips_per_school_day", assumptions_override)
            resolved_trips = t_assump.value
            assumptions_used.append("trips_per_school_day")
        elif dest_lower in ["college", "higher_education", "business_school"]:
            t_assump = get_assumption("trips_per_work_day", assumptions_override)
            resolved_trips = t_assump.value
            assumptions_used.append("trips_per_work_day")
            assumptions_used.append("college_commute_scenario")
        else:
            t_assump = get_assumption("trips_per_work_day", assumptions_override)
            resolved_trips = t_assump.value
            assumptions_used.append("trips_per_work_day")

    # Resolve days per year
    resolved_days = days_per_year
    if resolved_days is None:
        if dest_lower == "school":
            d_assump = get_assumption("school_days_per_year", assumptions_override)
            resolved_days = d_assump.value
            assumptions_used.append("school_days_per_year")
        elif dest_lower in ["college", "higher_education", "business_school"]:
            d_assump = get_assumption("college_days_per_year", assumptions_override)
            resolved_days = d_assump.value
            assumptions_used.append("college_days_per_year")
        else:
            d_assump = get_assumption("working_days_per_year", assumptions_override)
            resolved_days = d_assump.value
            assumptions_used.append("working_days_per_year")

    total_minutes = one_way_minutes * resolved_trips * resolved_days
    annual_hours = round(total_minutes / 60.0, 1)
    work_weeks_40h = round(annual_hours / 40.0, 1)

    status = "scenario" if dest_lower in ["college", "higher_education", "business_school", "other"] else "ok"

    return CalcResult(
        id="annual_commute_hours",
        value={
            "one_way_minutes": one_way_minutes,
            "destination_type": destination_type,
            "trips_per_day": resolved_trips,
            "days_per_year": resolved_days,
            "annual_hours": int(annual_hours) if annual_hours.is_integer() else annual_hours,
            "equivalent_40h_work_weeks": work_weeks_40h,
            "standard_work_week_hours": 40.0,
            "minutes_per_hour": 60.0
        },
        unit="hours/year",
        formula_text="annual_hours = (one_way_minutes * trips_per_day * days_per_year) / 60",
        inputs=inputs,
        assumptions=assumptions_used,
        status=status
    )

def implied_speed(
    distance_km: Optional[float],
    minutes: Optional[float]
) -> CalcResult:
    """
    Computes average speed in km/h from distance and duration.
    """
    inputs = {
        "distance_km": distance_km,
        "minutes": minutes
    }
    missing = [k for k, v in inputs.items() if v is None]
    if missing:
        return CalcResult(
            id="implied_speed",
            value=None,
            formula_text="speed_kmh = distance_km / (minutes / 60)",
            inputs=inputs,
            missing_inputs=missing
        )

    if minutes <= 0:
        return CalcResult(
            id="implied_speed",
            value=None,
            formula_text="minutes must be greater than zero",
            inputs=inputs,
            missing_inputs=["minutes must be > 0"]
        )

    speed_kmh = round(distance_km / (minutes / 60.0), 1)

    return CalcResult(
        id="implied_speed",
        value={
            "distance_km": distance_km,
            "minutes": minutes,
            "speed_kmh": speed_kmh
        },
        unit="km/h",
        formula_text="speed_kmh = distance_km / (minutes / 60)",
        inputs=inputs
    )
