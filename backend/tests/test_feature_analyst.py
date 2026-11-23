import json
import pytest
import httpx
from app.services.ai_feature_analyst import (
    generate_feature_intelligence,
    build_fallback_intelligence,
    generate_calculation_fallback_findings
)
from app.services.packet_builder import build_calculation_packet
from app.services.finding_validator import (
    validate_finding,
    validate_briefing,
    validate_fallback_payload
)

@pytest.fixture
def sample_property_data():
    return {
        "id": 1,
        "name": "Kingston Park",
        "locality": "Financial District",
        "total_units": 1406,
        "total_towers": 6,
        "floors": 24,
        "site_acres": 16.5,
        "unit_plans": [
            {
                "name": "2 BHK",
                "super_built_up_sqft": 1300,
                "carpet_sqft": 897,
                "price": 11200000,
                "facing": "East"
            },
            {
                "name": "3 BHK",
                "super_built_up_sqft": 1880,
                "carpet_sqft": 1297,
                "price": 16200000,
                "facing": "East"
            }
        ],
        "pricing_model": {
            "floor_rise_per_sqft": 25,
            "floor_rise_start_floor": 4
        },
        "transit_routes": [
            {
                "destination_name": "DLF Cyber City",
                "one_way_duration_minutes": 22.0,
                "distance_km": 8.0,
                "transit_mode": "car"
            }
        ]
    }


def test_calculation_fallback_non_narrative(sample_property_data):
    """
    Item 2: Fallback must NOT write narrative.
    When model is unavailable or validation fails:
    - show NO claim, NO 'what it changes', NO flip text (empty findings)
    - show ai_summary_available = False and briefing = None
    - show plain calculated numbers with labels and assumptions
    - must pass validate_fallback_payload
    """
    packet = build_calculation_packet(sample_property_data, "pricing")
    fallback = build_fallback_intelligence(packet, "pricing")

    assert fallback["ai_summary_available"] is False
    assert fallback["briefing"] is None
    assert len(fallback["findings"]) == 0
    assert len(fallback["key_numbers"]) >= 2
    assert "₹12,486" in [k["value"] for k in fallback["key_numbers"]]

    val_res = validate_fallback_payload(fallback, packet)
    assert val_res.is_valid is True, f"Fallback validation failed: {val_res.errors}"


def test_briefing_validator_rules(sample_property_data):
    """
    Item 3: Briefing validator rules:
    - At most 80 words
    - At most 4 questions
    - Traceable numbers
    - No advice or benchmark words
    """
    packet = build_calculation_packet(sample_property_data, "pricing")

    # 1. Valid briefing
    valid_briefing = {
        "briefing": "The ₹1.12 Cr 2 BHK costs ₹12,486 for every sq ft inside the walls. Upgrading to the 3 BHK adds 400 sq ft for ₹50 L, which is ₹12,500 per sq ft.",
        "key_numbers": [
            {"value": "₹12,486", "label": "carpet sq ft rate"},
            {"value": "₹12,500", "label": "marginal cost per extra sq ft"}
        ],
        "questions": [
            "Does the 5th floor pay floor rise, or does it start at the 6th?",
            "Is the balcony inside the ₹8,600 base rate?"
        ]
    }
    res_valid = validate_briefing(valid_briefing, packet)
    assert res_valid.is_valid is True, f"Valid briefing failed: {res_valid.errors}"

    # 2. Briefing exceeding 80 words rejected
    long_text = "word " * 85
    long_briefing = {
        "briefing": long_text,
        "key_numbers": [],
        "questions": ["Question?"]
    }
    res_long = validate_briefing(long_briefing, packet)
    assert res_long.is_valid is False
    assert any("exceeds maximum limit of 80 words" in e for e in res_long.errors)

    # 3. Briefing with advice ('you should buy') rejected
    advice_briefing = {
        "briefing": "You should buy this home now because the price is ₹12,486 per sq ft.",
        "key_numbers": [],
        "questions": []
    }
    res_advice = validate_briefing(advice_briefing, packet)
    assert res_advice.is_valid is False
    assert any("banned" in e or "advice" in e for e in res_advice.errors)

    # 4. Briefing with invented number rejected
    fake_num_briefing = {
        "briefing": "The rate is ₹99,999 per sq ft which is high.",
        "key_numbers": [],
        "questions": []
    }
    res_fake = validate_briefing(fake_num_briefing, packet)
    assert res_fake.is_valid is False
    assert any("Unmatched number" in e for e in res_fake.errors)


@pytest.mark.anyio
async def test_llm_successful_two_step_generation(sample_property_data, monkeypatch):
    """Test successful 2-step LLM response (Step 1 findings + Step 2 briefing)."""
    monkeypatch.setenv("AI_BASE_URL", "http://test-ai.local/v1")
    monkeypatch.setenv("AI_API_KEY", "test-key")

    step_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal step_count
        step_count += 1
        if step_count == 1:
            # Step 1: findings
            content = json.dumps({
                "findings": [
                    {
                        "claim": "Upgrading unit sizes costs ₹12,500 per additional carpet sq ft.",
                        "why_it_follows": "Moving from 897 to 1,297 sq ft adds ₹50,00,000 for 400 carpet sq ft, working out to ₹12,500 per additional sq ft.",
                        "what_it_changes": "Enables the buyer to assess if extra space justifies the cost.",
                        "flip_condition": "This flips if developer applies floor-specific discounts.",
                        "analytical_move": "reframe_the_unit",
                        "evidence_footnotes": [{"type": "calculated", "ref": "unit_plans.marginal_cost"}],
                        "assumptions_used": [],
                        "confidence": "high",
                        "kind": "finding"
                    }
                ]
            })
        else:
            # Step 2: briefing
            content = json.dumps({
                "briefing": "The 2 BHK costs ₹12,486 for every sq ft inside the walls. Upgrading to the 3 BHK adds 400 sq ft for ₹50 L, which is ₹12,500 per sq ft.",
                "key_numbers": [
                    {"value": "₹12,486", "label": "carpet sq ft rate"},
                    {"value": "₹12,500", "label": "marginal cost per extra sq ft"}
                ],
                "questions": [
                    "Does the 5th floor pay floor rise, or does it start at the 6th?"
                ]
            })
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        result = await generate_feature_intelligence(sample_property_data, "pricing", client=client)

    assert result["generated_by"] == "llm"
    assert result["llm_status"] == "active"
    assert result["ai_summary_available"] is True
    assert "₹12,486" in result["briefing"]
    assert len(result["findings"]) == 1
    assert len(result["questions"]) == 1


@pytest.mark.anyio
async def test_llm_fallback_on_timeout(sample_property_data, monkeypatch):
    """When LLM times out, engine falls back cleanly to non-narrative calculation state."""
    monkeypatch.setenv("AI_BASE_URL", "http://test-ai.local/v1")

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("Connection timed out")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        result = await generate_feature_intelligence(sample_property_data, "pricing", client=client)

    assert result["generated_by"] == "calculation"
    assert result["llm_status"] == "unavailable"
    assert result["ai_summary_available"] is False
    assert result["briefing"] is None
    assert len(result["findings"]) == 0
    assert len(result["key_numbers"]) >= 1


@pytest.mark.anyio
async def test_llm_fallback_on_unreachable(sample_property_data, monkeypatch):
    """When LLM server is unreachable / connection error, falls back to calculation state."""
    monkeypatch.setenv("AI_BASE_URL", "http://test-ai.local/v1")

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Could not connect to host")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        result = await generate_feature_intelligence(sample_property_data, "pricing", client=client)

    assert result["generated_by"] == "calculation"
    assert result["llm_status"] == "unavailable"
    assert result["ai_summary_available"] is False
    assert len(result["findings"]) == 0
    assert len(result["key_numbers"]) >= 1

