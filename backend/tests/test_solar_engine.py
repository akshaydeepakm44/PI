import pytest
from app.services.engines.solar_engine import (
    sun_pos,
    sunrise_hour,
    facade,
    shadow_length,
    clock,
    calculate_solar_seasons,
    calculate_tower_shadows,
    calculate_central_green_shade
)

def test_hyderabad_solar_noon_altitudes():
    lat = 17.45
    lon = 78.30
    seasons_res = calculate_solar_seasons(lat, lon)
    assert seasons_res.status == "ok"
    seasons = seasons_res.value
    
    # 21 Dec winter noon altitude ~ 49.1 deg
    dec_noon = seasons["21 Dec"]["noon_altitude_deg"]
    assert 48.9 <= dec_noon <= 49.3
    
    # 21 Jun summer noon altitude ~ 84.0 deg
    jun_noon = seasons["21 Jun"]["noon_altitude_deg"]
    assert 83.8 <= jun_noon <= 84.2

def test_hyderabad_sunrise_azimuths():
    lat = 17.45
    lon = 78.30
    seasons_res = calculate_solar_seasons(lat, lon)
    assert seasons_res.status == "ok"
    seasons = seasons_res.value
    
    # 21 Dec sunrise azimuth ~ 114.6 deg (ESE)
    dec_rise = seasons["21 Dec"]["sunrise_azimuth_deg"]
    assert 114.0 <= dec_rise <= 115.2
    
    # 21 Jun sunrise azimuth ~ 65.4 deg (ENE)
    jun_rise = seasons["21 Jun"]["sunrise_azimuth_deg"]
    assert 65.0 <= jun_rise <= 66.0

def test_tower_shadow_length_72m():
    lat = 17.45
    lon = 78.30
    # 24 floors * 3m = 72m height, 16.5 acres -> ~258m site width
    shadows_res = calculate_tower_shadows(lat, lon, floors=24, site_acres=16.5)
    assert shadows_res.status == "ok"
    shadows = shadows_res.value
    
    # Winter noon shadow ~ 62.3 m
    assert 61.5 <= shadows["dec_noon_shadow_m"] <= 63.0
    
    # Summer noon shadow ~ 7.6 m
    assert 7.0 <= shadows["jun_noon_shadow_m"] <= 8.2
    
    # Winter within site boundary duration
    assert shadows["dec_shadow_within_site_start"] == "08:03"
    assert shadows["dec_shadow_within_site_end"] == "16:31"

def test_facade_unshaded_hours_east_west():
    lat = 17.45
    # Dec declination = -23.44, Jun declination = 23.44
    east_dec = facade(lat, -23.44, 90.0)
    assert 5.0 <= east_dec["lit"] <= 6.0
    
    east_jun = facade(lat, 23.44, 90.0)
    assert 6.0 <= east_jun["lit"] <= 7.0

def test_central_green_shade_missing_geometry():
    # Without geometry, returns a data gap
    res = calculate_central_green_shade(17.45, 78.30, tower_footprints=None)
    assert res.status == "data_gap"
    assert "tower footprints needed" in res.missing_inputs[0].lower()

def test_missing_coordinates_data_gap():
    shadows = calculate_tower_shadows(None, None, 24)
    assert shadows.status == "data_gap"
