import pytest
from app.services.finding_validator import validate_finding, FindingValidationResult

def test_superlative_banned_without_rank_1_and_peer_count():
    packet = {
        "module": "standout",
        "results": [
            {
                "id": "density",
                "value": {"homes_per_lift": 78, "rank": 3, "cohort_total": 7}
            }
        ],
        "assumptions": {},
        "data_gaps": []
    }
    # Finding uses "best" but rank is 3
    finding = {
        "claim": "This project has the best lift density",
        "why_it_follows": "78 homes per lift across 6 towers with 3 lifts each.",
        "what_it_changes": "Worth asking the builder for lift speeds.",
        "flip_condition": "the builder adds more passenger lifts in revised plans.",
        "peer_context": "3 of 7 projects in Hyderabad"
    }
    res = validate_finding(finding, packet)
    assert res.is_valid is False
    assert any("superlative" in err.lower() for err in res.errors)

def test_competitor_name_rejection():
    packet = {
        "module": "pricing",
        "results": [{"id": "usable_foot", "value": {"rate_per_carpet": 12486}}],
        "assumptions": {},
        "data_gaps": []
    }
    # Finding mentions another project name "Solace Residences"
    finding = {
        "claim": "Price is lower than Solace Residences",
        "why_it_follows": "At 12486 per carpet sq ft the unit rate is different.",
        "what_it_changes": "Worth asking about baseline rate sheets.",
        "flip_condition": "other projects revise their published base rate."
    }
    res = validate_finding(finding, packet)
    assert res.is_valid is False
    assert any("competitor names are forbidden" in err.lower() for err in res.errors)

def test_air_and_sun_banned_words():
    packet = {
        "module": "liveability",
        "results": [{"id": "air_quality", "value": {"median_pm2_5_7d": 41.0}}],
        "assumptions": {},
        "data_gaps": []
    }
    # Uses "healthy" and "clean"
    finding = {
        "claim": "Air quality is completely healthy and clean",
        "why_it_follows": "At 41 µg/m³ PM2.5 the air provides a safe environment.",
        "what_it_changes": "Worth asking for on-site monitoring reports.",
        "flip_condition": "the builder changes surrounding green plantings."
    }
    res = validate_finding(finding, packet)
    assert res.is_valid is False
    assert any("prohibited qualitative/health word" in err.lower() for err in res.errors)

def test_novelty_gate_grid_restatement_rejection():
    packet = {
        "module": "liveability",
        "results": [{"id": "reviews", "value": {"parks_score": 4.1, "ratings": 128.0}}],
        "assumptions": {},
        "data_gaps": []
    }
    # Finding only restates grid numbers 4.1 and 128 with no derived calculation
    finding = {
        "claim": "Parks score 4.1 across 128 ratings",
        "why_it_follows": "128 ratings gave parks an average score of 4.1.",
        "what_it_changes": "Worth asking for review counts across other categories.",
        "flip_condition": "new resident reviews are submitted on public portals."
    }
    res = validate_finding(finding, packet)
    assert res.is_valid is False
    assert any("novelty gate" in err.lower() for err in res.errors)

def test_novelty_gate_removed_sample_texts_rejection():
    packet = {
        "module": "neighbourhood",
        "results": [{"id": "places", "value": {"groceries_distance": 1.2}}],
        "assumptions": {},
        "data_gaps": []
    }
    removed_texts = [
        "Groceries are the closest daily need at 1.2 km",
        "From this project it is 22 minutes each way to DLF Cyber City",
        "The school is nearly three times as far as the supermarket"
    ]
    for text in removed_texts:
        finding = {
            "claim": text,
            "why_it_follows": f"Because {text} is in the listing.",
            "what_it_changes": "Worth checking with builder.",
            "flip_condition": "different routes exist."
        }
        res = validate_finding(finding, packet)
        assert res.is_valid is False
        assert any("novelty gate" in err.lower() for err in res.errors)
