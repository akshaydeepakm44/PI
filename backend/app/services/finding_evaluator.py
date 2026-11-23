import os
import re
import json
import datetime
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

RUBRIC_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "feature_intelligence_rubric_audit.log")

LLM_JUDGE_SYSTEM_PROMPT = """You are an independent senior real-estate quality auditor evaluating property intelligence findings.
Grade the given finding strictly against the following 5 dimensions:
1. states_something_not_on_page (bool): Did it discover, calculate, or connect something not already plainly stated in the listing brochure?
2. number_traceable (bool): Is every cited number directly traceable to the calculation packet?
3. flip_names_specific_fact (bool): Does the flip condition name a specific project or builder fact rather than generic schedule/usage variations?
4. neutral_tone (bool): Is the tone completely neutral and factual, avoiding advice, imperatives ("must", "should"), or hype words?
5. consequence_tied_to_data (bool): Does what_it_changes state only direct mathematical effects or questions to ask the builder, without speculative leaps (e.g. loan eligibility, valuation, wiring)?

Output strictly a JSON object:
{
  "states_something_not_on_page": bool,
  "number_traceable": bool,
  "flip_names_specific_fact": bool,
  "neutral_tone": bool,
  "consequence_tied_to_data": bool,
  "passed_all": bool,
  "reason": "concise explanation"
}"""


def evaluate_finding_rubric(finding: Dict[str, Any], packet: Dict[str, Any]) -> Dict[str, Any]:
    """
    Automated second-pass review:
    Scores each finding against five quality rubrics:
      1. states_something_not_on_page: did it discover/calculate/connect something not already on the brochure page?
      2. number_traceable: is every cited number directly verifiable from packet results or assumptions?
      3. flip_specific: does flip_condition name a concrete, specific project fact that can overturn the claim?
      4. neutral_tone: strictly neutral consultant tone; zero advice, imperatives, or editorial hype.
      5. consequence_tied_to_data: what_it_changes states only mathematical consequences or questions for the builder.

    Logs its result permanently; does NOT auto-approve. Human reviewer retains final verdict.
    """
    from app.services.finding_validator import validate_finding

    claim = finding.get("claim", "")
    why = finding.get("why_it_follows", "")
    what = finding.get("what_it_changes", "")
    flip = finding.get("flip_condition", "")
    is_data_gap = finding.get("kind") == "data_gap" or claim.lower().startswith("data gap:")
    full_text = f"{claim} {why} {what} {flip}"

    # 1. States something not on page:
    # Requires derived calculation or gap sizing, not just restating an amenity location or static brochure field
    not_on_page = True
    if not is_data_gap:
        # Check if claim has any derived calculation numbers
        from app.services.finding_validator import extract_numbers_from_text, is_date_or_ordinal
        nums = extract_numbers_from_text(claim)
        derived_nums = [n for n in nums if not is_date_or_ordinal(n[0], claim, n[1])]
        if not derived_nums:
            not_on_page = False
        if re.search(r"\b(?:is located|is situated|features|boasts)\s+(?:on|in|at)\s+(?:the\s+)?(?:podium|clubhouse|ground)\b", claim, re.IGNORECASE):
            not_on_page = False

    # 2. Number traceable: verified through finding validator
    val_res = validate_finding(finding, packet)
    number_traceable = not any("Invented or unmatched number" in err for err in val_res.errors)

    # 3. Flip specific: names specific project or builder fact rather than generic schedule changes
    generic_flip_match = re.search(
        r"(?:the\s+)?assumptions?\s+differs?|(?:the\s+)?buyer'?s\s+actual\s+(?:working\s+days|schedule|trips|calendar)\s+differ|actual\s+usage\s+differs?",
        flip,
        re.IGNORECASE
    )
    flip_specific = (len(flip.strip()) >= 25) and (not generic_flip_match) and any(
        kw in flip.lower() for kw in ["addendum", "site plan", "agreement", "records", "drawing", "confirms", "provides", "clarifies", "revised", "resolved", "cancels"]
    )

    # 4. Neutral tone: no imperatives ("must", "should", "advisable"), no subjective qualifiers
    IMPERATIVES_AND_HYPE = [
        r"\b(?:must|should|advisable|visit|inspect|inspection)\b",
        r"\b(?:you\s+should|we\s+recommend|must\s+buy|best\s+deal|great\s+investment)\b",
        r"\b(?:substantial(?:ly)?|disproportionate(?:ly)?|relatively|significantly|major)\b",
        r"\b(?:high|low|small|large)\s+(?:percentage|sum|share|area|cost|amount|number|count|allocation|ratio|footprint|density)\b"
    ]
    has_editorial_or_imperative = any(re.search(pat, full_text, re.IGNORECASE) for pat in IMPERATIVES_AND_HYPE)
    neutral_tone = not has_editorial_or_imperative

    # 5. Consequence tied to data: what_it_changes must not speculate on loan eligibility, valuation, wiring, etc.
    UNSUPPORTED_SPECULATION = [
        r"\bloan\s+eligibility\b",
        r"\bvaluation\b",
        r"\bnegotiation\s+leverage\b",
        r"\bwiring\b",
        r"\binfrastructure\s+readiness\b",
        r"\bfuture\s+unit\s+additions\b",
        r"\breconfigurations?\b",
        r"\bgreen\s+space\s+and\s+outdoor\s+amenities\b",
        r"\boutdoor\s+amenities\b",
        r"\bresale\s+value\b",
        r"\bappreciation\b"
    ]
    has_speculation = any(re.search(pat, what, re.IGNORECASE) for pat in UNSUPPORTED_SPECULATION)
    consequence_tied = not has_speculation

    passed_all = not_on_page and number_traceable and flip_specific and neutral_tone and consequence_tied

    eval_result = {
        "claim": claim[:120],
        "rubric_scores": {
            "states_something_not_on_page": not_on_page,
            "number_traceable": number_traceable,
            "flip_specific": flip_specific,
            "neutral_tone": neutral_tone,
            "consequence_tied_to_data": consequence_tied
        },
        "passed_all_rubrics": passed_all,
        "validator_errors": val_res.errors
    }

    # Log permanently to rubric audit log
    try:
        log_entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "module": packet.get("module", "unknown"),
            "property_id": packet.get("property_id"),
            "evaluation": eval_result
        }
        with open(RUBRIC_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as log_err:
        logger.error(f"Failed to log rubric evaluation: {log_err}")

    return eval_result


async def evaluate_finding_llm_judge(
    finding: Dict[str, Any],
    packet: Dict[str, Any],
    client: Optional[httpx.AsyncClient] = None
) -> Dict[str, Any]:
    """
    Independent LLM-Judge pass:
    Calls the model with a separate evaluator prompt and 5-point rubric.
    Logs disagreements with rule-based validator; used to flag for human review, never to auto-approve.
    """
    rule_eval = evaluate_finding_rubric(finding, packet)

    base_url = settings.AI_BASE_URL or os.getenv("AI_BASE_URL", "")
    api_key = settings.AI_API_KEY or os.getenv("AI_API_KEY", "")
    model = settings.AI_MODEL or os.getenv("AI_MODEL", "current-model")

    if not base_url:
        return {
            "llm_judge_available": False,
            "rule_evaluation": rule_eval,
            "disagreement": False
        }

    finding_str = json.dumps(finding, indent=2)
    packet_summary = {
        "module": packet.get("module"),
        "results": packet.get("results"),
        "data_gaps": packet.get("data_gaps")
    }
    packet_str = json.dumps(packet_summary, indent=2)

    user_msg = (
        f"Calculation packet summary:\n```json\n{packet_str}\n```\n\n"
        f"Candidate finding to evaluate:\n```json\n{finding_str}\n```\n\n"
        "Evaluate this finding against the 5 rubrics and output strictly the JSON schema requested."
    )

    owns_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=45.0)
        owns_client = True

    llm_judge_result: Dict[str, Any] = {}
    try:
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": LLM_JUDGE_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg}
            ],
            "temperature": 0.1
        }

        resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        raw_text = resp.json()["choices"][0]["message"]["content"].strip()
        
        # Clean JSON from markdown fences if needed
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
        llm_judge_result = json.loads(cleaned)
    except Exception as judge_err:
        logger.warning(f"LLM-judge evaluation call failed: {judge_err}")
        llm_judge_result = {"error": str(judge_err), "passed_all": False}
    finally:
        if owns_client:
            await client.aclose()

    # Compare rule-based evaluation vs LLM-judge verdict
    rule_passed = rule_eval["passed_all_rubrics"]
    judge_passed = bool(llm_judge_result.get("passed_all", False))
    disagreement = (rule_passed != judge_passed)

    combined = {
        "llm_judge_available": True,
        "rule_evaluation": rule_eval,
        "llm_judge_result": llm_judge_result,
        "disagreement": disagreement
    }

    # Log disagreement if detected
    if disagreement:
        try:
            entry = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "event": "EVALUATOR_DISAGREEMENT",
                "finding_claim": finding.get("claim"),
                "rule_passed": rule_passed,
                "judge_passed": judge_passed,
                "details": combined
            }
            with open(RUBRIC_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as log_err:
            logger.error(f"Failed to log evaluator disagreement: {log_err}")

    return combined
