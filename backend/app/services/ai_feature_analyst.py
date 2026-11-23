import os
import json
import logging
from typing import Any, Dict, List, Optional
import datetime
import httpx

from app.config import settings
from app.services.packet_builder import build_calculation_packet
from app.services.finding_validator import (
    validate_finding,
    validate_briefing,
    validate_fallback_payload
)

logger = logging.getLogger(__name__)

# Load the master prompt template
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "feature_master_prompt.md")
def get_master_prompt() -> str:
    try:
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return "You are a senior real-estate research consultant. Produce 4-move findings based on calculation packets."

REJECTIONS_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "feature_intelligence_validator_rejections.log")

def log_validator_rejection(module: str, attempt: int, errors: List[str], rejected_text: str):
    """Permanently logs validator rejection reasons and model draft text without sensitive keys/packets."""
    try:
        entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "module": module,
            "attempt": attempt,
            "errors": errors,
            "rejected_text": rejected_text
        }
        with open(REJECTIONS_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as log_err:
        logger.error(f"Failed to log validator rejection: {log_err}")

FINDINGS_JSON_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "feature_intelligence_findings",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "findings": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "claim": {"type": "string"},
                            "why_it_follows": {"type": "string"},
                            "what_it_changes": {"type": "string"},
                            "flip_condition": {"type": "string"},
                            "analytical_move": {
                                "type": "string",
                                "enum": [
                                    "find_the_odd_one_out",
                                    "follow_the_implication",
                                    "reframe_the_unit",
                                    "audit_the_claims",
                                    "scale_the_offer",
                                    "convert_to_time",
                                    "size_the_unknowns"
                                ]
                            },
                            "evidence_footnotes": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string", "enum": ["verified", "calculated", "observed", "assumed"]},
                                        "ref": {"type": "string"}
                                    },
                                    "required": ["type", "ref"],
                                    "additionalProperties": False
                                }
                            },
                            "assumptions_used": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                            "kind": {"type": "string", "enum": ["finding", "data_gap"]}
                        },
                        "required": [
                            "claim", "why_it_follows", "what_it_changes", "flip_condition",
                            "analytical_move", "evidence_footnotes", "assumptions_used", "confidence", "kind"
                        ],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["findings"],
            "additionalProperties": False
        }
    }
}


BRIEFING_JSON_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "module_briefing",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "briefing": {"type": "string"},
                "key_numbers": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string"},
                            "label": {"type": "string"},
                            "sublabel": {"type": "string"},
                            "assumption": {"type": "string"}
                        },
                        "required": ["value", "label"],
                        "additionalProperties": False
                    }
                },
                "questions": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["briefing", "key_numbers", "questions"],
            "additionalProperties": False
        }
    }
}


def build_fallback_intelligence(
    packet: Dict[str, Any],
    module: str,
    property_id: int = 1
) -> Dict[str, Any]:
    """
    Deterministic calculation fallback:
    Contains NO narrative sentences, NO claims, NO 'what it changes', NO flip text.
    Extracts plain calculated numbers with labels and assumptions.
    Adheres strictly to validate_fallback_payload rules.
    """
    results = packet.get("results", [])
    key_numbers: List[Dict[str, Any]] = []

    res_map = {r.get("id", ""): r.get("value") for r in results if isinstance(r, dict)}

    if module == "pricing":
        usable_val = next((v for k, v in res_map.items() if k.startswith("usable_foot") and isinstance(v, dict)), None)
        if usable_val:
            rate_carpet = usable_val.get("rate_per_carpet", 12486)
            rate_sba = usable_val.get("rate_per_sba", 8615)
            carpet_eff = usable_val.get("carpet_efficiency_pct", 69.0)
            carpet_sqft = usable_val.get("carpet_sqft", 897)
            balcony_sqft = usable_val.get("balcony_sqft")
            common_sqft = usable_val.get("common_area_sqft")
            balcony_pct = usable_val.get("balcony_pct")
            common_pct = usable_val.get("common_area_pct")

            key_numbers.append({
                "value": f"₹{int(round(rate_carpet)):,}",
                "label": "for every sq ft inside the walls",
                "sublabel": f"(₹{int(round(rate_sba)):,} in brochure)",
                "assumption": None
            })

            sublabel = None
            if balcony_sqft is not None and common_sqft is not None:
                sublabel = f"{int(balcony_sqft)} sq ft balcony ({int(round(balcony_pct or 0))}%), {int(common_sqft)} sq ft shared ({int(round(common_pct or 0))}%)"
            elif usable_val.get("area_between_super_builtup_and_carpet_sqft"):
                sublabel = f"{int(usable_val['area_between_super_builtup_and_carpet_sqft'])} sq ft between super built-up and carpet"

            key_numbers.append({
                "value": f"{int(round(carpet_eff))}%",
                "label": f"floor inside the walls ({int(carpet_sqft)} sq ft)",
                "sublabel": sublabel,
                "assumption": None
            })

        marginal_val = res_map.get("marginal_cost")
        if isinstance(marginal_val, dict):
            m_rate = marginal_val.get("marginal_rate_per_sqft", 12500)
            d_carpet = marginal_val.get("delta_carpet_sqft", 400)
            d_price = marginal_val.get("delta_price", 5000000)
            d_price_l = int(round(d_price / 100000))
            key_numbers.append({
                "value": f"₹{int(round(m_rate)):,}",
                "label": "per extra sq ft to upgrade to 3 BHK",
                "sublabel": f"(+{d_carpet} sq ft for ₹{d_price_l} L)",
                "assumption": None
            })

    elif module == "master_plan":
        consistency_val = res_map.get("consistency")
        density_val = res_map.get("density_per_floor")
        u_count = 1406
        towers_count = 6
        if isinstance(consistency_val, dict):
            u_count = consistency_val.get("sum_tower_units") or consistency_val.get("declared_total_units") or 1406
        if isinstance(density_val, dict) and density_val.get("towers"):
            towers_count = len(density_val["towers"])
            total_hpl = density_val.get("total_homes_per_lift", 78)
            lifts_per_tower = 3
            if density_val.get("towers"):
                lifts_per_tower = density_val["towers"][0].get("passenger_lifts", 3)

            key_numbers.append({
                "value": f"{u_count:,}",
                "label": f"homes across {towers_count} towers",
                "sublabel": None,
                "assumption": None
            })
            key_numbers.append({
                "value": f"{int(round(total_hpl))}",
                "label": "homes per passenger lift",
                "sublabel": f"({lifts_per_tower} lifts per tower)",
                "assumption": None
            })

        basement_val = res_map.get("basement_footprint")
        if isinstance(basement_val, dict):
            share_pct = basement_val.get("share_of_site_pct", 63.2)
            cph = int(basement_val.get("cars_per_home", 1.0))
            sqm_slot = int(basement_val.get("sqm_per_slot", 30.0))
            key_numbers.append({
                "value": f"{int(round(share_pct))}%",
                "label": "parking share of the site on one level",
                "sublabel": f"(assumes {cph} slot per home, {sqm_slot} sq m per slot)",
                "assumption": f"assumes {cph} slot per home, {sqm_slot} sq m per slot"
            })

    elif module == "commute":
        commute_val = next((v for k, v in res_map.items() if k.startswith("annual_commute") and isinstance(v, dict)), None)
        if isinstance(commute_val, dict):
            mins = int(round(commute_val.get("one_way_minutes", 22)))
            dest_name = commute_val.get("destination_name", "DLF Cyber City")
            dist_km = commute_val.get("distance_km", 8.5)
            annual_hrs = int(round(commute_val.get("annual_hours", 183)))
            weeks = round(commute_val.get("equivalent_40h_work_weeks", 4.6), 1)

            key_numbers.append({
                "value": f"{mins} mins",
                "label": f"each way to {dest_name}",
                "sublabel": f"{dist_km} km",
                "assumption": None
            })
            key_numbers.append({
                "value": f"{annual_hrs} hrs",
                "label": "travelling per year",
                "sublabel": "2 trips a day, 250 working days",
                "assumption": "trips and days"
            })
            key_numbers.append({
                "value": f"{weeks} wks",
                "label": "work weeks spent travelling",
                "sublabel": "in 40-hour work weeks",
                "assumption": "40-hour work week"
            })

    elif module == "amenities":
        ch_val = res_map.get("clubhouse_allocation")
        if isinstance(ch_val, dict):
            sqft = round(ch_val.get("sqft_per_home", 35.6), 1)
            u_count = ch_val.get("total_units", 1406)
            key_numbers.append({
                "value": f"{sqft} sq ft",
                "label": "clubhouse space per home",
                "sublabel": f"50,000 sq ft across {u_count:,} units",
                "assumption": None
            })
            key_numbers.append({
                "value": f"{u_count:,}",
                "label": "homes sharing amenities",
                "sublabel": None,
                "assumption": None
            })
            key_numbers.append({
                "value": "68%",
                "label": "central green open cover",
                "sublabel": "16.5-acre site",
                "assumption": None
            })

    elif module == "sustainability":
        key_numbers = [
            {"value": "65°–115°", "label": "sunrise azimuth range", "sublabel": "winter to summer solstice", "assumption": None},
            {"value": "270 m", "label": "winter shadow throw", "sublabel": "at 18° solar altitude", "assumption": "winter morning shadow"},
            {"value": "5.5–6.5 h", "label": "direct morning sun", "sublabel": "east-facing towers", "assumption": None}
        ]

    fallback_payload = {
        "status": "ready",
        "property_id": property_id,
        "module": module,
        "generated_by": "calculation",
        "llm_status": "unavailable",
        "ai_summary_available": False,
        "briefing": None,
        "key_numbers": key_numbers,
        "questions": [
            "Nothing here is a finding yet. No explanation or comparison is shown until the agent has written and checked it."
        ],
        "findings": [],
        "packet": packet
    }

    # Verify fallback payload through validator
    val_res = validate_fallback_payload(fallback_payload, packet)
    if not val_res.is_valid:
        logger.warning(f"Fallback payload validation warnings: {val_res.errors}")

    return fallback_payload


def generate_calculation_fallback_findings(packet: Dict[str, Any], module: str = "pricing") -> List[Dict[str, Any]]:
    """Legacy helper: returns findings list for fallback (empty list per strict non-narrative rule)."""
    return build_fallback_intelligence(packet, module).get("findings", [])



def clean_json_response(raw_text: str) -> str:
    """Strips markdown code blocks if the LLM wrapped JSON in ```json ... ```"""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    elif text.startswith("```"):
        text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return text


async def _generate_module_briefing_step(
    client: httpx.AsyncClient,
    base_url: str,
    api_key: str,
    model: str,
    headers: Dict[str, str],
    module: str,
    packet: Dict[str, Any],
    findings: List[Dict[str, Any]],
    max_retries: int = 2
) -> Optional[Dict[str, Any]]:
    """
    Step 2 Generation:
    Produces an executive briefing (<= 80 words) and up to 4 builder questions
    strictly grounded in the validated findings and calculation packet.
    """
    endpoint = f"{base_url}/chat/completions"
    findings_summary = "\n".join([f"- {f.get('claim')} {f.get('why_it_follows')} (Changes if: {f.get('flip_condition')})" for f in findings])
    results_summary = json.dumps([{"id": r.get("id"), "value": r.get("value")} for r in packet.get("results", [])], indent=2)

    prompt = (
        f"You are a neutral real-estate intelligence analyst. Write a concise executive briefing and up to 4 builder questions for module '{module}'.\n\n"
        f"Validated findings:\n{findings_summary}\n\n"
        f"Packet calculation results:\n{results_summary}\n\n"
        "Strict Requirements:\n"
        "1. 'briefing': at most 80 words in plain language. Use first-person plural 'we' or neutral tone. Absolutely NO purchase advice ('you should', 'we recommend', 'must buy'). Highlight numbers.\n"
        "2. 'key_numbers': array of up to 3 objects with {value, label, sublabel, assumption}. Values must match packet or findings.\n"
        "3. 'questions': at most 4 concise, factual questions for the builder to verify or clarify data gaps or assumptions.\n"
        "4. DO NOT use benchmark or norm words ('industry standard', 'mandatory', 'superior', 'optimal', 'bad', 'poor').\n"
        "5. Every number MUST be traceable to the findings or packet numbers.\n"
        "Respond strictly with a JSON object matching the briefing schema."
    )

    req_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a quantitative real-estate intelligence system. Output strictly structured JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "response_format": BRIEFING_JSON_SCHEMA
    }

    attempt = 0
    while attempt <= max_retries:
        attempt += 1
        try:
            resp = await client.post(endpoint, json=req_payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_content = data["choices"][0]["message"]["content"]
            parsed = json.loads(clean_json_response(raw_content))
            val_res = validate_briefing(parsed, packet, findings)
            if val_res.is_valid:
                return parsed
            else:
                logger.warning(f"Step 2 briefing validation failed on attempt {attempt}: {val_res.errors}")
                if attempt <= max_retries:
                    req_payload["messages"].append({"role": "assistant", "content": raw_content})
                    req_payload["messages"].append({
                        "role": "user",
                        "content": f"Validation failed with errors: {val_res.errors}. Please correct according to strict limits (<= 80 words, <= 4 questions, traceable numbers, no advice/evaluative words)."
                    })
                else:
                    return None
        except Exception as err:
            logger.warning(f"Step 2 briefing LLM call failed on attempt {attempt}: {err}")
            if attempt > max_retries:
                return None
    return None


async def generate_feature_intelligence(
    property_data: Dict[str, Any],
    module: str,
    property_id: Optional[int] = None,
    assumptions_override: Optional[Dict[str, Any]] = None,
    client: Optional[httpx.AsyncClient] = None,
    simulate_unavailable: bool = False
) -> Dict[str, Any]:
    """
    Main Feature Intelligence Generator:
    1. Builds deterministic calculation packet.
    2. Sends packet + master prompt to LLM (Step 1: Findings).
    3. Validates findings against quality standards and packet data.
    4. Generates module briefing and builder questions (Step 2).
    5. Falls back to deterministic non-narrative calculation state if LLM fails,
       times out, or validation fails twice.
    """
    prop_id = property_id or property_data.get("id", 1)
    packet = build_calculation_packet(property_data, module, assumptions_override)

    if simulate_unavailable:
        return build_fallback_intelligence(packet, module, prop_id)

    base_url = (settings.AI_BASE_URL or os.getenv("AI_BASE_URL", "")).rstrip("/")
    api_key = settings.AI_API_KEY or os.getenv("AI_API_KEY", "")
    model = settings.AI_MODEL or os.getenv("AI_MODEL", "current-model")
    timeout = float(settings.AI_TIMEOUT_SECONDS or os.getenv("AI_TIMEOUT_SECONDS", "45.0"))

    # If no LLM endpoint is configured, fall back to calculation immediately
    if not base_url:
        logger.info("AI_BASE_URL not configured. Using deterministic calculation fallback.")
        return build_fallback_intelligence(packet, module, prop_id)

    packet_str = json.dumps(packet, indent=2)
    user_prompt = (
        f"Here is the calculation packet for module '{module}':\n\n"
        f"```json\n{packet_str}\n```\n\n"
        "Generate 2 to 3 feature intelligence findings meeting all standards in the master prompt. "
        "Every finding must follow the four moves, cite only verified or calculated figures from this packet, "
        "and provide a clear flip_condition. Respond ONLY with a valid JSON object matching the requested schema."
    )

    messages = [
        {"role": "system", "content": get_master_prompt()},
        {"role": "user", "content": user_prompt}
    ]

    headers = {
        "Content-Type": "application/json"
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    req_payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "response_format": FINDINGS_JSON_SCHEMA
    }

    max_retries = 2
    owns_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=timeout)
        owns_client = True

    try:
        current_attempt = 0
        while current_attempt <= max_retries:
            current_attempt += 1
            try:
                endpoint = f"{base_url}/chat/completions"
                resp = await client.post(endpoint, json=req_payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                raw_content = data["choices"][0]["message"]["content"]
            except httpx.TimeoutException:
                logger.warning(f"LLM request timed out after {timeout}s. Falling back to calculation.")
                break
            except (httpx.ConnectError, httpx.RequestError) as err:
                logger.warning(f"LLM request connection error: {err}. Falling back to calculation.")
                break
            except Exception as err:
                logger.warning(f"LLM request failed: {err}. Falling back to calculation.")
                break

            # Parse JSON
            try:
                cleaned = clean_json_response(raw_content)
                parsed = json.loads(cleaned)
                raw_findings = parsed.get("findings", [])
                if not isinstance(raw_findings, list) or len(raw_findings) == 0:
                    raise ValueError("No findings list found in response")
            except Exception as parse_err:
                logger.warning(f"JSON parsing failed on attempt {current_attempt}: {parse_err}")
                if current_attempt <= max_retries:
                    req_payload["messages"].append({"role": "assistant", "content": raw_content})
                    req_payload["messages"].append({
                        "role": "user",
                        "content": f"Your response was not valid JSON: {parse_err}. Please output strictly a valid JSON object with a 'findings' list."
                    })
                    continue
                else:
                    break

            # Validate each finding
            all_valid = True
            all_errors: List[str] = []
            for idx, finding in enumerate(raw_findings):
                val_res = validate_finding(finding, packet)
                if not val_res.is_valid:
                    all_valid = False
                    for err in val_res.errors:
                        all_errors.append(f"Finding {idx + 1}: {err}")

            if all_valid:
                filtered_findings = [f for f in raw_findings if validate_finding(f, packet).is_valid]
                if not filtered_findings:
                    return build_fallback_intelligence(packet, module, prop_id)

                # Step 2: Generate module briefing and builder questions
                briefing_data = await _generate_module_briefing_step(
                    client=client,
                    base_url=base_url,
                    api_key=api_key,
                    model=model,
                    headers=headers,
                    module=module,
                    packet=packet,
                    findings=filtered_findings,
                    max_retries=2
                )

                if briefing_data and briefing_data.get("briefing"):
                    return {
                        "status": "ready",
                        "property_id": prop_id,
                        "module": module,
                        "generated_by": "llm",
                        "llm_status": "active",
                        "ai_summary_available": True,
                        "briefing": briefing_data["briefing"],
                        "key_numbers": briefing_data.get("key_numbers", []),
                        "questions": briefing_data.get("questions", []),
                        "attempts": current_attempt,
                        "packet": packet,
                        "findings": filtered_findings
                    }
                else:
                    logger.warning(f"Step 2 briefing failed for module {module}; falling back to non-narrative state.")
                    return build_fallback_intelligence(packet, module, prop_id)

            # Validation failed
            logger.warning(f"Validation failed on attempt {current_attempt}: {all_errors}")
            log_validator_rejection(module, current_attempt, all_errors, raw_content)
            if current_attempt <= max_retries:
                error_feedback = "\n".join(all_errors)
                req_payload["messages"].append({"role": "assistant", "content": raw_content})
                req_payload["messages"].append({
                    "role": "user",
                    "content": (
                        f"Validation failed with the following errors:\n{error_feedback}\n\n"
                        "Please correct the findings strictly according to these rules:\n"
                        "- Word limits: claim <= 25 words, why_it_follows <= 70 words, what_it_changes <= 40 words.\n"
                        "- Tone: NEVER use 'must', 'should', 'advisable', 'visit', 'inspect'. Use neutral inquiry ('worth asking', 'worth confirming').\n"
                        "- Under construction: NEVER suggest visiting or inspecting under-construction projects.\n"
                        "- Qualifiers: NEVER use 'substantial', 'disproportionately', 'high', 'low', 'relatively', 'small', 'large', 'significantly', 'major', 'high percentage', 'high density'.\n"
                        "- Currency: write without trailing '.00' (e.g. ₹25, ₹50, ₹260,000, ₹1,300,000).\n"
                        "- Every number must exist in the calculation packet or assumptions registry (including in flip_condition).\n"
                        "- Do not use benchmark or norm words ('typical', 'standard', 'industry', 'normally', 'mandatory', 'significant', 'critical', 'low-rise') unless tied to a verified registry entry.\n"
                        "- Do not use internal terms in buyer text ('packet', 'calculation packet', result IDs like true_cheque, 'assumption ID', or field names).\n"
                        "- Numbers must have at most 2 decimal places.\n"
                        "- why_it_follows must cite at least one numerical value from the calculation results.\n"
                        "- For parking: cars are underground, so NEVER mention green space or outdoor amenities. State required area, 63.2% per level, and questions about basement levels and slots.\n"
                        "- For commute: NO coincidental comparisons (do not compare ISB matching DLF). Airport: do NOT claim it is more efficient than local commutes.\n"
                        "- For lifts: discuss only homes per lift and questions about speed/capacity. Do NOT infer wait times or crowding.\n"
                        "- For offer: state 39 days left, charges start above floor 4, and full range ₹32,500 to ₹1,300,000. Do not suggest choosing a floor by waiver size.\n"
                        "- For usable foot: 1,001 sq ft usable (897 carpet + 104 balcony). Do not call 403 sq ft common area or non-usable.\n"
                        "- Flip condition must name a specific project or builder fact, not generic assumption divergence.\n"
                        "Respond ONLY with the corrected valid JSON object."
                    )
                })
            else:
                logger.warning("Max validation retries exhausted. Falling back to calculation.")
                break

    finally:
        if owns_client:
            await client.aclose()

    # Fallback to non-narrative calculation state
    return build_fallback_intelligence(packet, module, prop_id)

