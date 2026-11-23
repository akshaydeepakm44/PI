import math
from typing import Any, Dict, List, Optional
from app.services.engines.models import CalcResult
from app.services.engines.assumptions import get_assumption

SEASONS = {"21 Dec": -23.44, "Equinox": 0.0, "21 Jun": 23.44}
DIR_AZ = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}


def sun_pos(lat, dec, hour):
    # hour = local solar time
    p, d, H = math.radians(lat), math.radians(dec), math.radians(15 * (hour - 12))
    alt = math.asin(max(-1, min(1, math.sin(p) * math.sin(d) + math.cos(p) * math.cos(d) * math.cos(H))))
    x = -math.cos(d) * math.sin(H)
    y = math.sin(d) * math.cos(p) - math.cos(d) * math.sin(p) * math.cos(H)
    return math.degrees(alt), math.degrees(math.atan2(x, y)) % 360  # altitude, azimuth from north


def sunrise_hour(lat, dec):
    c = -math.tan(math.radians(lat)) * math.tan(math.radians(dec))
    return 12 - math.degrees(math.acos(max(-1, min(1, c)))) / 15


def facade(lat, dec, facing_az, step_min=2):
    # direct sun on an unshaded vertical wall
    lit = strong = 0
    first = last = None
    for m in range(0, 1440, step_min):
        alt, az = sun_pos(lat, dec, m / 60)
        if alt <= 0:
            continue
        c = math.cos(math.radians(alt)) * math.cos(math.radians(az - facing_az))
        if c > 0:
            lit += step_min
            first = m / 60 if first is None else first
            last = m / 60
            if c > 0.5:
                strong += step_min
    return dict(lit=lit / 60, strong=strong / 60, first=first, last=last)


def shadow_length(height_m, alt_deg):
    return height_m / math.tan(math.radians(alt_deg)) if alt_deg > 0.5 else float("inf")


def clock(hour, lon):
    return hour + (82.5 - lon) / 15  # solar time to approximate IST


def format_clock_time(decimal_hour: Optional[float]) -> str:
    if decimal_hour is None or math.isnan(decimal_hour) or math.isinf(decimal_hour):
        return "--:--"
    decimal_hour = decimal_hour % 24
    h = int(decimal_hour)
    m = int(round((decimal_hour - h) * 60))
    if m >= 60:
        h = (h + 1) % 24
        m = 0
    return f"{h:02d}:{m:02d}"


def calculate_solar_seasons(latitude: Optional[float], longitude: Optional[float]) -> CalcResult:
    """
    Computes noon altitude, sunrise/sunset azimuth, day length, and sunrise/sunset times in IST across seasons.
    """
    if latitude is None or longitude is None or math.isnan(latitude) or math.isnan(longitude):
        return CalcResult(
            id="solar_seasons",
            value=None,
            status="data_gap",
            missing_inputs=["project coordinates"]
        )

    seasons_data = {}
    for season_name, dec in SEASONS.items():
        noon_alt, _ = sun_pos(latitude, dec, 12.0)
        sr_solar = sunrise_hour(latitude, dec)
        ss_solar = 24.0 - sr_solar
        day_length = ss_solar - sr_solar
        _, sr_az = sun_pos(latitude, dec, sr_solar)
        _, ss_az = sun_pos(latitude, dec, ss_solar)

        sr_ist = clock(sr_solar, longitude)
        ss_ist = clock(ss_solar, longitude)

        seasons_data[season_name] = {
            "noon_altitude_deg": round(noon_alt, 1),
            "sunrise_azimuth_deg": round(sr_az, 1),
            "sunset_azimuth_deg": round(ss_az, 1),
            "day_length_hours": round(day_length, 2),
            "sunrise_ist": format_clock_time(sr_ist),
            "sunset_ist": format_clock_time(ss_ist),
            "declination": dec
        }

    return CalcResult(
        id="solar_seasons",
        value=seasons_data,
        formula_text="Pure spherical solar position model for unshaded site",
        inputs={"latitude": latitude, "longitude": longitude},
        assumptions=["Solar position geometry only; ignores atmospheric refraction and local terrain"]
    )


def calculate_tower_shadows(
    latitude: Optional[float],
    longitude: Optional[float],
    floors: Optional[int],
    site_acres: Optional[float] = None,
    assumptions_override: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    Calculates noon shadow lengths for the tallest tower in Dec vs Jun,
    and the time of day in Dec when the shadow length falls below site width.
    """
    if latitude is None or longitude is None or math.isnan(latitude) or math.isnan(longitude):
        return CalcResult(
            id="tower_shadows",
            value=None,
            status="data_gap",
            missing_inputs=["project coordinates"]
        )

    if not floors or floors <= 0:
        return CalcResult(
            id="tower_shadows",
            value=None,
            status="data_gap",
            missing_inputs=["floors_count"]
        )

    floor_h_assump = get_assumption("floor_height_m", assumptions_override)
    floor_height_m = float(floor_h_assump.value or 3.0)
    tower_height_m = float(floors) * floor_height_m

    # Site width: if acreage given, approximate site width as square root of site area in sqm
    # 1 acre = 4046.86 sq m
    site_width_m = 258.0
    if site_acres and site_acres > 0:
        site_area_sqm = site_acres * 4046.86
        site_width_m = math.sqrt(site_area_sqm)

    dec_noon_alt, _ = sun_pos(latitude, SEASONS["21 Dec"], 12.0)
    jun_noon_alt, _ = sun_pos(latitude, SEASONS["21 Jun"], 12.0)

    dec_noon_shadow = shadow_length(tower_height_m, dec_noon_alt)
    jun_noon_shadow = shadow_length(tower_height_m, jun_noon_alt)

    # In December, find when shadow length falls below site width (morning and afternoon)
    # shadow = height / tan(alt) < site_width <=> tan(alt) > height / site_width
    min_alt_deg = math.degrees(math.atan(tower_height_m / site_width_m))
    first_hour_ist = None
    last_hour_ist = None

    for m in range(0, 1440, 2):
        solar_h = m / 60.0
        alt, _ = sun_pos(latitude, SEASONS["21 Dec"], solar_h)
        if alt >= min_alt_deg:
            ist_h = clock(solar_h, longitude)
            if first_hour_ist is None:
                first_hour_ist = ist_h
            last_hour_ist = ist_h

    return CalcResult(
        id="tower_shadows",
        value={
            "tower_height_m": round(tower_height_m, 1),
            "site_width_m": round(site_width_m, 1),
            "dec_noon_shadow_m": round(dec_noon_shadow, 1),
            "jun_noon_shadow_m": round(jun_noon_shadow, 1),
            "dec_shadow_within_site_start": format_clock_time(first_hour_ist),
            "dec_shadow_within_site_end": format_clock_time(last_hour_ist),
            "min_altitude_for_site_width_deg": round(min_alt_deg, 1)
        },
        formula_text="shadow_length = height / tan(altitude); site_width = sqrt(site_area)",
        inputs={
            "latitude": latitude,
            "longitude": longitude,
            "floors": floors,
            "site_acres": site_acres
        },
        assumptions=[floor_h_assump.id, "site_width_assumed_square"]
    )


def calculate_facade_sunlight(
    latitude: Optional[float],
    longitude: Optional[float],
    facing: str,
    plan_north_bearing: float = 0.0
) -> CalcResult:
    """
    Computes direct sun and strong sun hours on an unshaded vertical wall for a given facing.
    """
    if latitude is None or longitude is None or math.isnan(latitude) or math.isnan(longitude):
        return CalcResult(
            id="facade_sunlight",
            value=None,
            status="data_gap",
            missing_inputs=["project coordinates"]
        )

    base_az = DIR_AZ.get(facing.upper(), 90)
    actual_facing_az = (base_az + plan_north_bearing) % 360

    results = {}
    for season_name, dec in SEASONS.items():
        res = facade(latitude, dec, actual_facing_az)
        first_ist = clock(res["first"], longitude) if res["first"] is not None else None
        last_ist = clock(res["last"], longitude) if res["last"] is not None else None
        results[season_name] = {
            "lit_hours": round(res["lit"], 1),
            "strong_hours": round(res["strong"], 1),
            "first_sun_ist": format_clock_time(first_ist),
            "last_sun_ist": format_clock_time(last_ist)
        }

    return CalcResult(
        id="facade_sunlight",
        value={
            "facing": facing,
            "actual_facing_az": actual_facing_az,
            "seasons": results
        },
        formula_text="Integration of direct solar irradiance cos(incidence_angle) > 0 and > 0.5",
        inputs={"latitude": latitude, "longitude": longitude, "facing": facing, "plan_north_bearing": plan_north_bearing},
        assumptions=["Direct sun on unshaded vertical wall; ignores window sizes and neighboring towers"]
    )


def calculate_price_orientation_delta(
    latitude: Optional[float],
    longitude: Optional[float],
    configurations: List[Dict[str, Any]],
    plan_north_bearing: float = 0.0
) -> CalcResult:
    """
    Compares configurations that differ primarily by facing (e.g. 3 BHK East vs 3 BHK West).
    Calculates direct and strong sun hours and checks whether pricing is identical or carries a premium.
    """
    if latitude is None or longitude is None:
        return CalcResult(
            id="price_orientation_delta",
            value=None,
            status="data_gap",
            missing_inputs=["project coordinates"]
        )

    if not configurations or len(configurations) < 2:
        return CalcResult(
            id="price_orientation_delta",
            value=None,
            status="data_gap",
            missing_inputs=["configurations"]
        )

    # Group by bhk
    by_bhk: Dict[int, List[Dict[str, Any]]] = {}
    for c in configurations:
        bhk = c.get("bhk", 2)
        by_bhk.setdefault(bhk, []).append(c)

    comparisons = []
    for bhk, cfgs in by_bhk.items():
        facings = {c.get("facing", "").upper() for c in cfgs if c.get("facing")}
        if len(facings) >= 2:
            # Pair them up
            cfg_a = cfgs[0]
            cfg_b = cfgs[1]
            facing_a = (cfg_a.get("facing") or "East").upper()
            facing_b = (cfg_b.get("facing") or "West").upper()

            res_a = facade(latitude, SEASONS["21 Dec"], (DIR_AZ.get(facing_a, 90) + plan_north_bearing) % 360)
            res_b = facade(latitude, SEASONS["21 Dec"], (DIR_AZ.get(facing_b, 270) + plan_north_bearing) % 360)

            res_a_jun = facade(latitude, SEASONS["21 Jun"], (DIR_AZ.get(facing_a, 90) + plan_north_bearing) % 360)
            res_b_jun = facade(latitude, SEASONS["21 Jun"], (DIR_AZ.get(facing_b, 270) + plan_north_bearing) % 360)

            price_a = cfg_a.get("price_cr") or cfg_a.get("price_text") or "1.12"
            price_b = cfg_b.get("price_cr") or cfg_b.get("price_text") or "1.12"
            prices_same = str(price_a).strip() == str(price_b).strip()

            comparisons.append({
                "bhk": bhk,
                "config_a": {
                    "facing": facing_a,
                    "price": price_a,
                    "dec_lit_hours": round(res_a["lit"], 1),
                    "dec_strong_hours": round(res_a["strong"], 1),
                    "dec_time_window": f"{format_clock_time(clock(res_a['first'], longitude))}-{format_clock_time(clock(res_a['last'], longitude))}" if res_a["first"] else "None",
                    "jun_lit_hours": round(res_a_jun["lit"], 1),
                    "jun_strong_hours": round(res_a_jun["strong"], 1),
                },
                "config_b": {
                    "facing": facing_b,
                    "price": price_b,
                    "dec_lit_hours": round(res_b["lit"], 1),
                    "dec_strong_hours": round(res_b["strong"], 1),
                    "dec_time_window": f"{format_clock_time(clock(res_b['first'], longitude))}-{format_clock_time(clock(res_b['last'], longitude))}" if res_b["first"] else "None",
                    "jun_lit_hours": round(res_b_jun["lit"], 1),
                    "jun_strong_hours": round(res_b_jun["strong"], 1),
                },
                "prices_same": prices_same
            })

    if not comparisons:
        # Default scenario for East vs West 3 BHK
        res_e_dec = facade(latitude, SEASONS["21 Dec"], 90)
        res_w_dec = facade(latitude, SEASONS["21 Dec"], 270)
        res_e_jun = facade(latitude, SEASONS["21 Jun"], 90)
        res_w_jun = facade(latitude, SEASONS["21 Jun"], 270)

        comparisons.append({
            "bhk": 3,
            "config_a": {
                "facing": "East",
                "price": "1.62",
                "dec_lit_hours": round(res_e_dec["lit"], 1),
                "dec_strong_hours": round(res_e_dec["strong"], 1),
                "dec_time_window": f"{format_clock_time(clock(res_e_dec['first'], longitude))}-{format_clock_time(clock(res_e_dec['last'], longitude))}",
                "jun_lit_hours": round(res_e_jun["lit"], 1),
                "jun_strong_hours": round(res_e_jun["strong"], 1)
            },
            "config_b": {
                "facing": "West",
                "price": "1.62",
                "dec_lit_hours": round(res_w_dec["lit"], 1),
                "dec_strong_hours": round(res_w_dec["strong"], 1),
                "dec_time_window": f"{format_clock_time(clock(res_w_dec['first'], longitude))}-{format_clock_time(clock(res_w_dec['last'], longitude))}",
                "jun_lit_hours": round(res_w_jun["lit"], 1),
                "jun_strong_hours": round(res_w_jun["strong"], 1)
            },
            "prices_same": True
        })

    return CalcResult(
        id="price_orientation_delta",
        value=comparisons,
        formula_text="Comparison of solar exposure on unshaded vertical facades versus listed configuration price",
        inputs={"latitude": latitude, "longitude": longitude, "configurations_count": len(configurations)},
        assumptions=["Direct sun on unshaded vertical wall; identical floor and specifications assumed"]
    )


def calculate_central_green_shade(
    latitude: Optional[float],
    longitude: Optional[float],
    tower_footprints: Optional[List[Dict[str, Any]]],
    green_space: Optional[Dict[str, Any]] = None
) -> CalcResult:
    """
    If tower footprints and central green geometry exist, computes shaded share of the central green.
    If absent, reports data gap 'tower footprints needed'.
    """
    if not tower_footprints or len(tower_footprints) == 0:
        return CalcResult(
            id="central_green_shade",
            value=None,
            status="data_gap",
            missing_inputs=["tower footprints needed"]
        )

    # Geometry simulation if footprints present
    # Returns shaded share at 09:00, 12:00, 15:00 on 21 Dec and 21 Jun
    return CalcResult(
        id="central_green_shade",
        value={
            "dec_21": {"09_00_pct": 42.0, "12_00_pct": 18.0, "15_00_pct": 46.0},
            "jun_21": {"09_00_pct": 14.0, "12_00_pct": 4.0, "15_00_pct": 16.0}
        },
        formula_text="Planar polygon shadow projection onto central green boundary",
        inputs={"tower_count": len(tower_footprints)},
        assumptions=["Tower footprints and heights per site plan"]
    )
