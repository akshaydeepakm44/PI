from typing import Any, Dict, List, Optional
from app.services.engines.models import CalcResult

def claim_ledger(
    claims: Optional[List[Dict[str, Any]]],
    data: Optional[Dict[str, Any]]
) -> CalcResult:
    """
    Audits marketing claims: marks each claim as supported | partly | contradicted | uncheckable,
    with the exact field that decides it.
    """
    inputs = {
        "claims_count": len(claims) if claims else 0,
        "data_keys": list(data.keys()) if data else []
    }
    if not claims:
        return CalcResult(
            id="claim_ledger",
            value=None,
            formula_text="Audit of claims against verified data fields",
            inputs=inputs,
            missing_inputs=["claims"]
        )

    audited_claims = []
    supported_cnt = 0
    contradicted_cnt = 0
    uncheckable_cnt = 0
    partly_cnt = 0

    for item in claims:
        claim_text = item.get("claim", "")
        target_field = item.get("target_field", "")
        expected_val = item.get("expected_val")

        actual_val = None
        if data and target_field in data:
            actual_val = data[target_field]

        verdict = "uncheckable"
        deciding_field = target_field
        reason = "Target field not present in verified data"

        if actual_val is not None:
            if expected_val is not None:
                if str(actual_val).strip().lower() == str(expected_val).strip().lower():
                    verdict = "supported"
                    reason = f"Verified: field '{target_field}' equals '{actual_val}'"
                elif str(expected_val).strip().lower() in str(actual_val).strip().lower():
                    verdict = "partly"
                    reason = f"Partly matches: '{target_field}' is '{actual_val}'"
                else:
                    verdict = "contradicted"
                    reason = f"Conflict: expected '{expected_val}', found '{actual_val}'"
            else:
                verdict = "supported" if actual_val else "partly"
                reason = f"Field '{target_field}' present with value '{actual_val}'"

        if verdict == "supported":
            supported_cnt += 1
        elif verdict == "contradicted":
            contradicted_cnt += 1
        elif verdict == "partly":
            partly_cnt += 1
        else:
            uncheckable_cnt += 1

        audited_claims.append({
            "claim": claim_text,
            "target_field": target_field,
            "verdict": verdict,
            "deciding_field": deciding_field,
            "actual_val": actual_val,
            "reason": reason
        })

    return CalcResult(
        id="claim_ledger",
        value={
            "audited_claims": audited_claims,
            "supported_count": supported_cnt,
            "contradicted_count": contradicted_cnt,
            "partly_count": partly_cnt,
            "uncheckable_count": uncheckable_cnt,
            "total_claims": len(claims)
        },
        unit="claims",
        formula_text="Cross-reference claim targets against verified database fields",
        inputs=inputs
    )
