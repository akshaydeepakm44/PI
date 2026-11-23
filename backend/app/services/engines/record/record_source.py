import os
import json
import datetime
from typing import Any, Dict, List, Optional

OFFICIAL_RECORD_UPLOADS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "data", "official_records"
)

def lookup_registration(rera_number: Optional[str], state: Optional[str] = "Telangana") -> Dict[str, Any]:
    """
    Looks up public record data from permitted sources (official API, licensed feed, or uploaded official filings).
    In accordance with safety and compliance guidelines, does NOT scrape external unpermitted portals.
    If no official feed or uploaded filing is present, returns {'checked': False, 'status': 'not checked'}.
    """
    if not rera_number:
        return {
            "checked": False,
            "status": "not checked",
            "reason": "No registration number provided",
            "family": "record",
            "source": "official_record_portal",
            "date": datetime.date.today().isoformat(),
            "confidence": 0.0
        }

    # Check for permitted uploaded official filings in data directory
    if os.path.exists(OFFICIAL_RECORD_UPLOADS_DIR):
        clean_num = rera_number.replace("/", "_").replace("\\", "_").strip()
        record_file = os.path.join(OFFICIAL_RECORD_UPLOADS_DIR, f"{clean_num}.json")
        if os.path.exists(record_file):
            try:
                with open(record_file, "r", encoding="utf-8") as f:
                    rec = json.load(f)
                    return {
                        "checked": True,
                        "found": True,
                        "project_name": rec.get("project_name"),
                        "status": rec.get("status", "registered"),
                        "registration_date": rec.get("registration_date"),
                        "completion_date": rec.get("completion_date"),
                        "declared_units": rec.get("declared_units"),
                        "declared_acres": rec.get("declared_acres"),
                        "approvals": rec.get("approvals", []),
                        "source_url": rec.get("source_url", "https://rera.telangana.gov.in"),
                        "fetched_at": rec.get("fetched_at", datetime.date.today().isoformat()),
                        "family": "record",
                        "source": "official_rera_filing",
                        "date": rec.get("fetched_at", datetime.date.today().isoformat()),
                        "confidence": 0.9
                    }
            except Exception:
                pass

    # If no permitted API / feed / verified upload exists:
    return {
        "checked": False,
        "found": False,
        "status": "not checked",
        "reason": "No permitted direct API connection or verified official filing available for this jurisdiction",
        "family": "record",
        "source": "official_record_portal",
        "date": datetime.date.today().isoformat(),
        "confidence": 0.0
    }


def compare_record_with_builder_data(
    record_result: Dict[str, Any],
    builder_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compares public record with builder data.
    Result states: verified / differs / not found / not checked
    """
    if not record_result.get("checked"):
        return {
            "status": "not checked",
            "registration_number_match": "not checked",
            "name_match": "not checked",
            "possession_match": "not checked",
            "units_match": "not checked",
            "family": "record",
            "source": "official_record_portal",
            "date": datetime.date.today().isoformat(),
            "confidence": 0.0,
            "summary": "Record: not checked (no permitted official API feed or uploaded filing)"
        }

    if not record_result.get("found"):
        return {
            "status": "not found",
            "registration_number_match": "not found",
            "name_match": "not found",
            "possession_match": "not found",
            "units_match": "not found",
            "family": "record",
            "source": "official_record_portal",
            "date": record_result.get("fetched_at") or datetime.date.today().isoformat(),
            "confidence": 0.9,
            "summary": "Record: not found on public portal"
        }

    builder_name = (builder_data.get("name") or "").strip().lower()
    rec_name = (record_result.get("project_name") or "").strip().lower()
    name_state = "verified" if (builder_name and rec_name and (builder_name in rec_name or rec_name in builder_name)) else "differs"

    # Possession comparison: builder promised possession vs registered completion
    builder_possession = str(builder_data.get("possession_date") or "").strip().lower()
    rec_completion = str(record_result.get("completion_date") or "").strip().lower()
    possession_state = "verified" if (builder_possession and rec_completion and builder_possession == rec_completion) else "differs" if (builder_possession and rec_completion) else "not checked"

    builder_units = builder_data.get("unit_count") or builder_data.get("total_units")
    rec_units = record_result.get("declared_units")
    units_state = "verified" if (builder_units and rec_units and int(builder_units) == int(rec_units)) else "differs" if (builder_units and rec_units) else "not checked"

    overall_status = "differs" if ("differs" in [name_state, possession_state, units_state]) else "verified"

    return {
        "status": overall_status,
        "registration_number_match": "verified",
        "name_match": name_state,
        "possession_match": possession_state,
        "units_match": units_state,
        "registered_completion_date": record_result.get("completion_date"),
        "builder_possession_date": builder_data.get("possession_date"),
        "family": "record",
        "source": record_result.get("source", "official_rera_filing"),
        "date": record_result.get("date", datetime.date.today().isoformat()),
        "confidence": 0.9,
        "summary": f"Record: {overall_status} (registered completion {record_result.get('completion_date')})"
    }
