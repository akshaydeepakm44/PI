import re
import math
from typing import Any, Dict, List, Optional, Set, Tuple

# Banned words / phrases that indicate sales advice, ranking or guarantees
BANNED_WORDS = [
    r"\bbest\b",
    r"\bworst\b",
    r"\byou should buy\b",
    r"\byou should book\b",
    r"\bwill appreciate\b",
    r"\bguaranteed\b",
    r"\bcompletely safe\b",
    r"\brisk[- ]free\b",
    r"\bgood investment\b",
    r"\bmust buy\b",
    r"\btop[- ]ranked\b",
]

# Health, comfort, and atmospheric qualitative verdicts banned near air or sunlight findings
AIR_SUN_BANNED_WORDS = [
    r"\bhealthy\b",
    r"\bsafe\b",
    r"\bclean\b",
    r"\bbright\b",
    r"\bhot\b",
    r"\bcomfortable\b",
    r"\bgood\s+light\b",
]

# Other project / competitor names that must never be revealed
OTHER_PROJECT_NAMES = [
    r"\bSolace\s+Residences\b",
    r"\bAparna\s+Sowparnika\b",
    r"\bRhythm\s+of\s+Rain\b",
    r"\bAurelia\s+Heights\b",
    r"\bSattva\s+Greenwood\b",
    r"\bLakeview\s+Residences\b",
    r"\bUrbania\s+Meadows\b",
]

# Superlative words
SUPERLATIVE_WORDS = [
    r"\bbest\b",
    r"\bworst\b",
    r"\bhighest\b",
    r"\blowest\b",
    r"\btop\b",
    r"\bcheapest\b",
    r"\bcleanest\b",
    r"\bfastest\b",
    r"\bslowest\b",
]

MONTH_NAMES = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*"

DATE_ORDINAL_PATTERNS = [
    # Ordinals: 1st, 2nd, 3rd, 4th, 24th
    re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)\b", re.IGNORECASE),
    # Floor words: floor 12, floors 4, level 2
    re.compile(r"\b(?:floor|floors|level)\s+(\d{1,2})\b", re.IGNORECASE),
    # Towers / Blocks: Tower 1, Towers 1, 2, Block 2, Phase 1, Wing A
    re.compile(r"\b(?:tower|towers|block|blocks|phase|wing)\s+(\d{1,2})\b", re.IGNORECASE),
    # Bedroom / BHK: 2 BHK, 3 BHK, 2 bedroom, 3 bed
    re.compile(r"\b(\d{1,2})\s*(?:bhk|bedroom|bed)\b", re.IGNORECASE),
    # Date patterns: 21 Dec, 31 December, 21st Jun
    re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+{MONTH_NAMES}\b", re.IGNORECASE),
    # Month first: Dec 21, June 21st
    re.compile(rf"\b{MONTH_NAMES}\s+(\d{{1,2}})(?:st|nd|rd|th)?\b", re.IGNORECASE),
]

def parse_indian_number(token: str) -> Optional[float]:
    """
    Normalizes Indian and standard number formats:
    - ₹6.5 lakh / 6.5 lakh / ₹6.5 L (with currency) -> 650000
    - "135 L" (WITHOUT currency) -> 135.0 (litres, NOT lakh)
    - ₹1.12 Cr / 1.12 crore -> 11200000
    - 6,50,000 / 12,500 -> 650000 / 12500
    - 69% -> 69.0
    - 20x / 20× -> 20.0
    """
    clean = token.strip()
    has_currency = bool(re.search(r"(?:₹|rs\.?|inr|rupees?)", clean, re.IGNORECASE))
    
    # Strip currency signs
    stripped = re.sub(r"(?:₹|rs\.?|inr|rupees?|\$)\s*", "", clean, flags=re.IGNORECASE).strip()

    # 1. Match Crore: e.g. 1.12 Cr, 1.12 crore, 1.12crores
    cr_match = re.match(r"^([\d\.]+)\s*(?:cr|crore|crores)\b", stripped, re.IGNORECASE)
    if cr_match:
        try:
            return round(float(cr_match.group(1)) * 10_000_000.0, 2)
        except ValueError:
            pass

    # 2. Match Lakh with word "lakh" or "lakhs"
    lakh_word_match = re.match(r"^([\d\.]+)\s*(?:lakh|lakhs)\b", stripped, re.IGNORECASE)
    if lakh_word_match:
        try:
            return round(float(lakh_word_match.group(1)) * 100_000.0, 2)
        except ValueError:
            pass

    # 3. Match "L" suffix: ONLY treat "L" as lakh when preceded by currency!
    # "135 L" without currency is litres -> 135.0, NOT lakh!
    l_suffix_match = re.match(r"^([\d\.]+)\s*l\b", stripped, re.IGNORECASE)
    if l_suffix_match:
        if has_currency:
            try:
                return round(float(l_suffix_match.group(1)) * 100_000.0, 2)
            except ValueError:
                pass
        else:
            try:
                return float(l_suffix_match.group(1))
            except ValueError:
                pass

    # 4. Match Multiplier: e.g. 20x, 20×, 23x
    mult_match = re.match(r"^([\d\.]+)\s*(?:x|×)\b", stripped, re.IGNORECASE)
    if mult_match:
        try:
            return float(mult_match.group(1))
        except ValueError:
            pass

    # 5. Match Percentage: e.g. 69%, 69.0%
    pct_match = re.match(r"^([\d\.]+)\s*%", stripped)
    if pct_match:
        try:
            return float(pct_match.group(1))
        except ValueError:
            pass

    # 6. Standard number with Indian/standard commas: e.g. 6,50,000 or 42,180.5
    comma_clean = stripped.replace(",", "")
    num_match = re.match(r"^[\d\.]+$", comma_clean)
    if num_match:
        try:
            return float(comma_clean)
        except ValueError:
            pass

    return None

def extract_numbers_from_text(text: str) -> List[Tuple[float, str]]:
    """
    Extracts all numeric mentions from text, returning tuples of (parsed_value, original_token).
    Recognizes Indian currency units (Cr, L, Lakh), commas, percentages, multipliers.
    Uses word boundaries on text prefixes so words ending in 'rs' (like 'towers 1') do not match currency.
    """
    tokens = re.findall(
        r"(?:(?:₹|\b(?:rs\.?|inr|rupees?|\$))\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:\b(?:cr|crore|crores|lakh|lakhs|l)\b|[x×%]))?",
        text,
        re.IGNORECASE
    )
    results = []
    for t in tokens:
        val = parse_indian_number(t)
        if val is not None:
            results.append((val, t.strip()))
    return results

def is_date_or_ordinal(val: float, text: str, token: str) -> bool:
    """
    Checks if a number is a date, year, ordinal, or universal time conversion unit.
    A bare number like '20x' or plain '20' is NOT an ordinal/date.
    """
    # If the token itself has multiplier suffix 'x' or '×', it's NOT a date/ordinal
    if re.search(r"[x×]", token, re.IGNORECASE):
        return False

    if not isinstance(val, (int, float)) or not float(val).is_integer() or val <= 0:
        return False

    int_val = int(val)
    str_val = str(int_val)

    # 1. 4-digit calendar years: 1990 - 2040
    if 1990 <= int_val <= 2040:
        if re.search(rf"\b(?:{MONTH_NAMES}\s+{str_val}|{str_val}\s+{MONTH_NAMES}|in\s+{str_val}|by\s+{str_val}|year\s+{str_val}|possession\s+(?:in\s+)?{MONTH_NAMES}?\s*{str_val})\b", text, re.IGNORECASE):
            return True
        if re.search(rf"[A-Z0-9]+-{str_val}-[A-Z0-9]+", text, re.IGNORECASE):
            return True

    # 2. Universal time conversion units (60 mins/hour, 40 hrs/work week, 24 hrs/day, 365 days/year)
    if int_val in [60, 40, 24, 365, 7]:
        if re.search(rf"\b(?:{str_val}\s*(?:mins?|minutes?|hrs?|hours?|work\s+weeks?|days?|weeks?)|(?:divided\s+by|\/)\s*{str_val})\b", text, re.IGNORECASE):
            return True

    # 3. Days of the month and ordinals (1 - 31)
    if 1 <= int_val <= 31:
        for pat in DATE_ORDINAL_PATTERNS:
            for match in pat.finditer(text):
                if match.group(1) == str_val:
                    return True

    return False

def count_sig_figs(token: str) -> int:
    """
    Extracts the number of significant digits from the written representation.
    Examples:
    - '6.5 lakh' -> 2
    - '12,500' -> 3 (trailing zeros without decimal indicate precision to hundreds)
    - '12,550' -> 4 (precision to tens)
    - '63%' -> 2
    - '5%' -> 1
    """
    cleaned = re.sub(
        r"(?:₹|\$|rs\.?|inr|rupees?|%|[x×]|lakh|lakhs|cr|crore|crores|l)",
        "",
        token,
        flags=re.IGNORECASE
    ).replace(",", "").strip()
    m = re.match(r"^([\d\.]+)", cleaned)
    if not m:
        return 2
    s = m.group(1).lstrip("0")
    if not s:
        return 1
    if "." in s:
        s = s.replace(".", "")
        return max(1, len(s))
    else:
        s = s.rstrip("0")
        return max(1, len(s))

def round_to_sig_figs(val: float, n: int) -> float:
    """
    Rounds a number to n significant digits.
    """
    if val == 0:
        return 0.0
    d = math.ceil(math.log10(abs(val)))
    power = n - d
    magnitude = 10 ** power
    return round(val * magnitude) / magnitude

def matches_number(val: float, token: str, targets: Set[float], max_rel_diff: float = 0.005) -> bool:
    """
    Strict significant-digit and relative precision matching:
    1. Exact match (or within float epsilon 1e-4)
    2. Within 0.5% relative tolerance AND rounds to the written precision:
       A number written with N significant digits must equal the packet value
       rounded to N significant digits.
    """
    for t in targets:
        if abs(t - val) < 1e-4:
            return True
        if t == 0:
            continue

        rel_diff = abs(val - t) / abs(t)
        # Must be within 0.5% relative tolerance
        if rel_diff <= max_rel_diff:
            n_figs = count_sig_figs(token)
            rounded = round_to_sig_figs(t, n_figs)
            if abs(rounded - val) < 1e-3:
                return True
    return False

def _collect_numbers_from_obj(obj: Any, out_set: Set[float]):
    if isinstance(obj, (int, float)):
        out_set.add(float(obj))
        out_set.add(abs(float(obj)))
    elif isinstance(obj, str):
        cleaned = obj.strip()
        if re.match(r"^-?\d+(?:\.\d+)?$", cleaned):
            try:
                f = float(cleaned)
                out_set.add(f)
                out_set.add(abs(f))
            except ValueError:
                pass
    elif isinstance(obj, dict):
        for v in obj.values():
            _collect_numbers_from_obj(v, out_set)
    elif isinstance(obj, list):
        for item in obj:
            _collect_numbers_from_obj(item, out_set)

def extract_valid_numbers_from_packet(packet: Dict[str, Any]) -> Tuple[Set[float], Dict[str, float]]:
    """
    Gathers all numerical values from packet results and assumptions registry.
    Collects both positive and absolute values so deltas/gaps match correctly.
    """
    valid_numbers: Set[float] = set()
    assumption_numbers: Dict[str, float] = {}

    results = packet.get("results", [])
    for res in results:
        _collect_numbers_from_obj(res.get("value"), valid_numbers)
        _collect_numbers_from_obj(res.get("inputs"), valid_numbers)

    data_gaps = packet.get("data_gaps", [])
    for gap in data_gaps:
        _collect_numbers_from_obj(gap, valid_numbers)

    assumptions = packet.get("assumptions", {})
    for a_id, a_data in assumptions.items():
        if isinstance(a_data, dict):
            a_val = a_data.get("value")
        else:
            a_val = a_data
        if isinstance(a_val, (int, float)):
            f_val = float(a_val)
            valid_numbers.add(f_val)
            valid_numbers.add(abs(f_val))
            assumption_numbers[a_id] = f_val

    return valid_numbers, assumption_numbers

class FindingValidationResult:
    def __init__(self, is_valid: bool, errors: List[str]):
        self.is_valid = is_valid
        self.errors = errors

    def __repr__(self):
        return f"FindingValidationResult(valid={self.is_valid}, errors={self.errors})"

def validate_finding(finding: Dict[str, Any], packet: Dict[str, Any]) -> FindingValidationResult:
    """
    Validates a FindingItem against the calculation packet and quality rules.
    """
    errors: List[str] = []

    # 1. Flip condition must be present and non-empty
    flip = finding.get("flip_condition", "").strip()
    if not flip:
        errors.append("flip_condition is missing or empty")

    claim = finding.get("claim", "")
    why = finding.get("why_it_follows", "")
    what = finding.get("what_it_changes", "")
    is_data_gap_finding = finding.get("kind") == "data_gap" or claim.lower().startswith("data gap:")
    # 5a. Check numbers in flip_condition too
    full_text = f"{claim} {why} {what} {flip}"

    # 3i. Word count limits: claim <= 25 words, why <= 70 words, what <= 40 words
    claim_words = len(claim.split())
    if claim_words > 25:
        errors.append(f"claim exceeds 25 words ({claim_words} words)")
    why_words = len(why.split())
    if why_words > 70:
        errors.append(f"why_it_follows exceeds 70 words ({why_words} words)")
    what_words = len(what.split())
    if what_words > 40:
        errors.append(f"what_it_changes exceeds 40 words ({what_words} words)")

    # 3i. Reject unnecessary trailing .00 on currency (e.g. ₹25.00, ₹50.00)
    for m_cur in re.finditer(r"₹\d+(?:,\d+)*\.00\b", full_text):
        errors.append(f"Currency '{m_cur.group(0)}' contains unnecessary trailing '.00'; write as integer (e.g. ₹25, ₹50, ₹260,000)")
        break

    # 3h. flip_condition must name a specific fact about the project or builder, not "the assumption differs"
    GENERIC_FLIP_PATTERNS = [
        r"(?:the\s+)?assumptions?\s+differs?",
        r"(?:the\s+)?buyer'?s\s+actual\s+(?:working\s+days|schedule|trips|calendar)\s+differ",
        r"actual\s+(?:working\s+days|schedule|trips|calendar)\s+differ",
        r"actual\s+usage\s+differs?"
    ]
    for gfp in GENERIC_FLIP_PATTERNS:
        m_gfp = re.search(gfp, flip, re.IGNORECASE)
        if m_gfp:
            errors.append("flip_condition must name a specific project or builder fact, not generic assumption divergence")
            break

    # 3b. Reject imperatives and visit/inspect suggestions; require neutral inquiry
    IMPERATIVE_WORDS = [
        r"\bmust\b",
        r"\bshould\b",
        r"\badvisable\b",
        r"\bvisit\b",
        r"\binspect\b",
        r"\binspection\b"
    ]
    for imp in IMPERATIVE_WORDS:
        m_imp = re.search(imp, full_text, re.IGNORECASE)
        if m_imp:
            errors.append(f"Contains directive/imperative phrasing or visit suggestion ('{m_imp.group(0)}'); neutral inquiry required (e.g. 'worth asking' or 'worth confirming')")
            break

    # 3c. Reject suggestions to visit or inspect when project is under construction
    is_under_construction = False
    metadata = packet.get("metadata", {}) or {}
    if metadata.get("construction_status", "").lower() in ["under construction", "under-construction"]:
        is_under_construction = True
    for res in packet.get("results", []):
        val = res.get("value")
        if isinstance(val, dict) and str(val.get("construction_status", "")).lower() in ["under construction", "under-construction"]:
            is_under_construction = True
            break
    if is_under_construction:
        m_vis = re.search(r"\b(?:visit|inspect|site\s+visit|physical\s+inspection)\b", full_text, re.IGNORECASE)
        if m_vis:
            errors.append("Suggests visiting or inspecting a project that is currently under construction")

    # 3a. Reject crowding, congestion, or wait-time inference from area ratios or lift ratios
    # unless capacity or speed numbers are in the packet
    CROWD_PATTERNS = [
        r"\bcrowd(?:ing|ed)?\b",
        r"\bcongestion\b",
        r"\bwait[- ]times?\b",
        r"\bdelays?\b"
    ]
    packet_has_speed_or_capacity = False
    for res in packet.get("results", []):
        val = res.get("value")
        if isinstance(val, dict):
            if any(k in val for k in ["lift_speed_mps", "cab_capacity", "pool_capacity", "hourly_throughput", "speed_mps"]):
                packet_has_speed_or_capacity = True
                break
    for cp in CROWD_PATTERNS:
        m_cp = re.search(cp, full_text, re.IGNORECASE)
        if m_cp and not packet_has_speed_or_capacity:
            errors.append(f"Infers crowding, congestion, or wait times ('{m_cp.group(0)}') without verified capacity or speed numbers in the packet")
            break

    # 3d. Restatement detector: drop non-gap finding whose claim is a field value, location or boolean with no engine-derived number
    if not is_data_gap_finding:
        claim_nums = extract_numbers_from_text(claim)
        derived_claim_nums = [
            (v, tok) for v, tok in claim_nums
            if not is_date_or_ordinal(v, claim, tok)
        ]
        if not derived_claim_nums:
            errors.append("Claim restates a brochure field, location, or boolean attribute with no engine-derived calculation")
        elif re.search(r"\b(?:is located|is situated|features|boasts)\s+(?:on|in|at)\s+(?:the\s+)?(?:podium|clubhouse|ground)\b", claim, re.IGNORECASE):
            errors.append("Claim restates amenity location without an engine-derived calculation")

    # 3e. Reject quantity and size words: substantial, disproportionately, relatively, significantly, major
    QUANTITY_WORDS = [
        r"\bsubstantial(?:ly)?\b",
        r"\bdisproportionate(?:ly)?\b",
        r"\brelative(?:ly)?\b",
        r"\bsignificant(?:ly)?\b",
        r"\bmajor\b"
    ]
    for qw in QUANTITY_WORDS:
        m_qw = re.search(qw, full_text, re.IGNORECASE)
        if m_qw:
            errors.append(f"Uses subjective quantity/size word '{m_qw.group(0)}' instead of exact numbers")
            break

    # Subjective qualifiers: high/low/small/large modifying general nouns
    SUBJECTIVE_QUALIFIERS = [
        r"\b(?:high|low|small|large)\s+(?:percentage|sum|share|area|cost|amount|number|count|allocation|ratio|footprint|density)\b"
    ]
    for sq in SUBJECTIVE_QUALIFIERS:
        m_sq = re.search(sq, full_text, re.IGNORECASE)
        if m_sq:
            errors.append(f"Uses subjective qualifier '{m_sq.group(0)}' instead of exact quantified values")
            break

    # 3f. what_it_changes may contain only (i) effects computed from packet numbers or (ii) questions to ask the builder.
    UNSUPPORTED_CONSEQUENCES = [
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
    for uc in UNSUPPORTED_CONSEQUENCES:
        m_uc = re.search(uc, what, re.IGNORECASE)
        if m_uc:
            errors.append(f"what_it_changes contains unsupported speculative consequence ('{m_uc.group(0)}'); must state only direct mathematical effects or questions for the builder")
            break

    # 3g. Reject coincidental comparisons (e.g. ISB commute hours matching DLF Cyber City)
    COINCIDENTAL_PATTERNS = [
        r"\b(?:matching|equals?|identical to|same as)\s+(?:the\s+)?(?:dlf|cyber city|isb)\b",
        r"\bmatching the dlf cyber city figure\b",
        r"\bidentical to the .* calculated for dlf\b"
    ]
    for cp in COINCIDENTAL_PATTERNS:
        m_cp = re.search(cp, full_text, re.IGNORECASE)
        if m_cp:
            errors.append("Compares two disparate metrics or destinations without establishing a structural dependency (coincidental comparison)")
            break

    # 5c. Reject internal implementation terms in buyer text
    INTERNAL_TERMS = [
        r"\b(?:calculation\s+)?packet\b",
        r"\bassumption\s+id\b",
        r"\btrue_cheque\b",
        r"\busable_foot\b",
        r"\boffer_skew\b",
        r"\bmarginal_cost\b",
        r"\bdensity_per_floor\b",
        r"\bbasement_footprint\b",
        r"\bannual_commute(?:_hours)?\b",
        r"\bimplied_speed\b",
        r"\bstraight_line_distances\b",
        r"\bclubhouse_allocation\b",
        r"\bclaim_ledger\b",
        r"\brate_per_carpet\b",
        r"\brate_per_usable\b",
        r"\bdelta_price\b",
        r"\bdelta_carpet_sqft\b",
        r"\bmarginal_rate_per_sqft\b",
        r"\bstart_floor\b",
        r"\bfloor_rise_total\b",
        r"\bshare_above_headline_pct\b",
        r"\bsqft_per_home\b",
        r"\bunits_count\b",
        r"\bpassenger_lifts\b",
        r"\bhomes_per_lift\b"
    ]
    for term_pat in INTERNAL_TERMS:
        m_term = re.search(term_pat, full_text, re.IGNORECASE)
        if m_term:
            errors.append(f"Contains internal implementation term '{m_term.group(0)}' in buyer text")

    # 5d. Reject numbers with more than 2 decimal places
    for m_dec in re.finditer(r"\b\d+\.(\d{3,})\b", full_text):
        errors.append(f"Number '{m_dec.group(0)}' has more than 2 decimal places; precision must be rounded")

    # 2. Check for banned words or guarantees
    for banned in BANNED_WORDS:
        if re.search(banned, full_text, re.IGNORECASE):
            errors.append(f"Contains banned sales advice or guarantee phrasing matching '{banned}'")

    # Check for other project / competitor names
    for name_pat in OTHER_PROJECT_NAMES:
        m_name = re.search(name_pat, full_text, re.IGNORECASE)
        if m_name:
            errors.append(f"Contains name of another project '{m_name.group(0)}'; competitor names are forbidden")

    # Check for air and sun qualitative/health words
    is_air_or_sun = any(k in full_text.lower() for k in ["air", "pm2.5", "pm10", "aqi", "sun", "sunlight", "facade", "shadow", "solar"]) or packet.get("module") in ["neighbourhood", "liveability", "master_plan"]
    if is_air_or_sun:
        for air_pat in AIR_SUN_BANNED_WORDS:
            m_air = re.search(air_pat, full_text, re.IGNORECASE)
            if m_air:
                errors.append(f"Contains prohibited qualitative/health word '{m_air.group(0)}' in air/sunlight analysis")

    # Check for superlative words
    for sup_pat in SUPERLATIVE_WORDS:
        m_sup = re.search(sup_pat, full_text, re.IGNORECASE)
        if m_sup:
            has_rank_1 = False
            for r in packet.get("results", []):
                val = r.get("value")
                if isinstance(val, dict):
                    if val.get("rank") == 1 and (val.get("cohort_total") or val.get("peer_count", 0)) >= 5:
                        has_rank_1 = True
                    if isinstance(val.get("all_metrics"), dict):
                        for m_info in val["all_metrics"].values():
                            if isinstance(m_info, dict) and m_info.get("rank") == 1 and (m_info.get("cohort_total") or m_info.get("peer_count", 0)) >= 5:
                                has_rank_1 = True
            peer_context_stated = bool(re.search(r"\b(?:among|of|out of|in|across)\s+(\d+)\s*(?:peers|projects|properties)?\b", full_text, re.IGNORECASE))
            if not (has_rank_1 and peer_context_stated):
                errors.append(f"Superlative '{m_sup.group(0)}' is forbidden unless computed as rank 1 among at least 5 peers and the peer count is stated")

    # Novelty Gate: Restatements check
    GRID_RESTATED_NUMBERS = {
        "liveability": {4.1, 128.0, 3.6, 74.0, 94.0},
        "neighbourhood": {3.0, 3.4, 1.2},
    }
    mod = packet.get("module", "")
    if mod in GRID_RESTATED_NUMBERS:
        grid_nums = GRID_RESTATED_NUMBERS[mod]
        finding_nums = set()
        for num_val, tok in extract_numbers_from_text(full_text):
            if not is_date_or_ordinal(num_val, full_text, tok):
                finding_nums.add(num_val)
        if finding_nums and finding_nums.issubset(grid_nums):
            errors.append(f"Fails novelty gate: numbers {finding_nums} only restate displayed section grid fields without a derived engine calculation")

    BANNED_SAMPLE_RESTATEMENTS = [
        "Groceries are the closest daily need at 1.2 km",
        "From this project it is 22 minutes each way to DLF Cyber City",
        "The school is nearly three times as far as the supermarket"
    ]
    for b_stmt in BANNED_SAMPLE_RESTATEMENTS:
        if b_stmt.lower() in full_text.lower():
            errors.append(f"Fails novelty gate: text restates removed sample listing claim ('{b_stmt}')")

    # 5b. Reject benchmark and norm words unless tied to a verified registry entry (verified=True)
    NORM_WORDS = [
        r"\btypical\b", r"\bstandard\b", r"\bindustry\b", r"\bnormally\b",
        r"\bmandatory\b", r"\bsignificant\b", r"\bcritical\b", r"\blow-rise\b"
    ]
    assumptions_used = finding.get("assumptions_used", [])
    packet_assumptions = packet.get("assumptions", {})
    verified_assumptions = []
    for a_id in assumptions_used:
        a_obj = packet_assumptions.get(a_id)
        if isinstance(a_obj, dict) and a_obj.get("verified") is True:
            verified_assumptions.append(a_id)
        elif hasattr(a_obj, "verified") and getattr(a_obj, "verified") is True:
            verified_assumptions.append(a_id)
    has_verified_norm = len(verified_assumptions) > 0  # Requires human-verified assumption
    for norm_pat in NORM_WORDS:
        m_norm = re.search(norm_pat, full_text, re.IGNORECASE)
        if m_norm:
            norm_word = m_norm.group(0).lower()
            if not has_verified_norm or norm_word in ["mandatory", "low-rise", "critical", "significant"]:
                errors.append(f"Uses unverified benchmark/norm word '{m_norm.group(0)}' not tied to a verified registry entry")

    # 3. Check for claims regarding data gaps
    is_data_gap_finding = finding.get("kind") == "data_gap" or claim.lower().startswith("data gap:")
    data_gaps = packet.get("data_gaps", [])
    gap_fields = []
    for g in data_gaps:
        if isinstance(g, dict):
            gap_fields.append(g.get("field", "").lower())
        else:
            gap_fields.append(str(g).lower())

    # 5f. Reject editorial words in data-gap findings
    if is_data_gap_finding:
        EDITORIAL_WORDS = [
            r"\bcritical\b", r"\bsignificant\s+omission\b", r"\brising\s+adoption\b",
            r"\bcrucial\b", r"\bvital\b", r"\bdire\b", r"\bdrastic\b"
        ]
        for ed_pat in EDITORIAL_WORDS:
            m_ed = re.search(ed_pat, full_text, re.IGNORECASE)
            if m_ed:
                errors.append(f"Data-gap finding contains editorial phrasing '{m_ed.group(0)}'")

    if not is_data_gap_finding:
        for gap in gap_fields:
            if gap and len(gap) > 3:
                if re.search(rf"\b{re.escape(gap)}\b", full_text, re.IGNORECASE):
                    if not re.search(rf"(?:not (?:in the data|known|established|available|captured)|missing|unconfirmed|gap|unstated)\s+(?:for\s+)?{re.escape(gap)}", full_text, re.IGNORECASE):
                        errors.append(f"Finding states a fact about field '{gap}' which is listed in data_gaps")

    # 4. Check for pure field restatements (no derived numbers)
    results = packet.get("results", [])
    has_derived_number = is_data_gap_finding
    if not has_derived_number:
        for res in results:
            res_id = res.get("id", "")
            if any(res_id.startswith(prefix) for prefix in [
                "marginal_cost", "offer_skew", "usable_foot", "true_cheque",
                "density_per_floor", "consistency", "basement_footprint",
                "annual_commute", "implied_speed", "straight_line_distances",
                "clubhouse_allocation", "claim_ledger", "solar_shadow"
            ]):
                val = res.get("value")
                if val is not None:
                    has_derived_number = True
                    break

    if not has_derived_number:
        errors.append("Finding only restates a raw field with no derived calculation")

    # 5e. Reject non-gap finding whose why_it_follows contains no number from the results
    if not is_data_gap_finding:
        why_extracted = extract_numbers_from_text(why)
        result_numbers: Set[float] = set()
        for res in results:
            _collect_numbers_from_obj(res.get("value"), result_numbers)
        has_result_num = any(matches_number(num, tok, result_numbers) for num, tok in why_extracted)
        if not has_result_num:
            errors.append("why_it_follows contains no numerical value from the calculation results")

    # 5. Extract and verify all numbers in text
    valid_numbers, assumption_numbers = extract_valid_numbers_from_packet(packet)
    extracted = extract_numbers_from_text(full_text)
    assumptions_used = finding.get("assumptions_used", [])

    for num_val, original_token in extracted:
        # Check if date/ordinal exemption applies
        if is_date_or_ordinal(num_val, full_text, original_token):
            continue

        # Strict match against packet numbers
        matched = matches_number(num_val, original_token, valid_numbers)
        if not matched:
            errors.append(f"Invented or unmatched number '{original_token}' (value {num_val}) not found in calculation packet")
        else:
            # Check if this number is from an assumption
            for a_id, a_val in assumption_numbers.items():
                if matches_number(num_val, original_token, {a_val}):
                    relevant = True
                    if a_id == "cars_per_home":
                        relevant = bool(re.search(r"\b(?:car|cars|parking|slot|slots|vehicle)\b", full_text, re.IGNORECASE))
                    elif a_id == "sqm_per_parking_slot":
                        relevant = bool(re.search(r"\b(?:bay|slot|slots|parking|sqm|sq m)\b", full_text, re.IGNORECASE))
                    elif a_id in ["scenario_floor_rise_rate_25", "scenario_floor_rise_rate_50"]:
                        # When citing builder documentation or conflict, it is an observed data gap / documented rate
                        if bool(re.search(r"\b(?:conflict|conflicting|rate|pricing|additional|charges|breakdown|sheet|waiver|offer)\b", full_text, re.IGNORECASE)):
                            relevant = False

                    if relevant:
                        if a_id not in assumptions_used:
                            errors.append(f"Assumption value '{original_token}' used without listing '{a_id}' in assumptions_used")
                        if not re.search(r"\b(?:assum(?:ed|ption|ing)|estimate|scenario|conflict|conflicting)\b", full_text, re.IGNORECASE):
                            errors.append(f"Assumption value '{original_token}' used but text does not identify it as an assumption")

    return FindingValidationResult(is_valid=(len(errors) == 0), errors=errors)

def validate_followup_answer(answer_text: str, packet: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates a conversational follow-up answer against the calculation packet.
    1. Rejects banned promotional phrasing.
    2. Rejects markdown headings (#, ##, ###).
    3. Rejects any invented numbers not found in packet results, inputs, or assumptions registry.
    """
    errors: List[str] = []
    # Check for markdown headings
    if re.search(r"^\s*#{1,6}\s+", answer_text, re.MULTILINE):
        errors.append("Answer contains markdown headings; direct prose required.")

    # Check for banned words
    for banned in BANNED_WORDS:
        if re.search(banned, answer_text, re.IGNORECASE):
            errors.append(f"Answer contains banned promotional/advice phrasing matching '{banned}'")

    # Check numbers
    valid_numbers, _ = extract_valid_numbers_from_packet(packet)
    extracted = extract_numbers_from_text(answer_text)
    for num_val, token in extracted:
        if is_date_or_ordinal(num_val, answer_text, token):
            continue
        if not matches_number(num_val, token, valid_numbers):
            errors.append(f"Invented or unmatched number '{token}' (value {num_val}) not in packet")

    return (len(errors) == 0, errors)

def validate_briefing(
    briefing_data: Dict[str, Any],
    packet: Dict[str, Any],
    findings: Optional[List[Dict[str, Any]]] = None
) -> FindingValidationResult:
    """
    Validates a Step 2 module briefing according to strict standards:
    1. Briefing length at most 80 words.
    2. At most 4 builder questions.
    3. Plain language (first-person plural 'we' or neutral, absolutely NO advice).
    4. Numbers strictly traceable to packet results, inputs, or validated findings.
    5. No prohibited benchmark, evaluative, or promotional words.
    """
    errors: List[str] = []
    briefing_text = briefing_data.get("briefing") or ""
    questions = briefing_data.get("questions") or []
    key_numbers = briefing_data.get("key_numbers") or []

    # 1. Word limit: at most 80 words
    words = briefing_text.split()
    if len(words) > 80:
        errors.append(f"Briefing word count ({len(words)}) exceeds maximum limit of 80 words.")

    # 2. Questions limit: at most 4 questions
    if len(questions) > 4:
        errors.append(f"Briefing questions count ({len(questions)}) exceeds maximum limit of 4 questions.")

    # 3. Tone & prohibited words check
    for banned in BANNED_WORDS:
        if re.search(banned, briefing_text, re.IGNORECASE):
            errors.append(f"Briefing contains banned advice/promotional phrasing matching '{banned}'")

    # Prohibited evaluative & benchmark words
    evaluative_words = [
        r"\b(?:you\s+should|we\s+recommend|recommend|advisable|must\s+buy|avoid)\b",
        r"\b(?:industry\s+standard|mandatory|superior|optimal|generous|bad|poor|terrible)\b",
        r"\b(?:substantial|disproportionately|relatively|significantly|major)\b",
        r"\b(?:visit|inspect|tour)\b"
    ]
    for pattern in evaluative_words:
        if re.search(pattern, briefing_text, re.IGNORECASE):
            errors.append(f"Briefing contains prohibited advice or evaluative wording matching '{pattern}'")

    # 4. Number traceability: numbers in briefing and key_numbers must match packet or findings
    valid_numbers, _ = extract_valid_numbers_from_packet(packet)
    # Add numbers from validated findings to valid numbers
    if findings:
        for f in findings:
            for k in ["claim", "why_it_follows", "what_it_changes", "flip_condition"]:
                for val, tok in extract_numbers_from_text(f.get(k, "")):
                    valid_numbers.add(val)

    # Check numbers in briefing text
    for num_val, token in extract_numbers_from_text(briefing_text):
        if is_date_or_ordinal(num_val, briefing_text, token):
            continue
        if not matches_number(num_val, token, valid_numbers):
            errors.append(f"Unmatched number '{token}' (value {num_val}) in briefing not traceable to packet or findings")

    # Check numbers in key_numbers
    for item in key_numbers:
        val_str = str(item.get("value", ""))
        for num_val, token in extract_numbers_from_text(val_str):
            if is_date_or_ordinal(num_val, val_str, token):
                continue
            if not matches_number(num_val, token, valid_numbers):
                errors.append(f"Unmatched number '{token}' in key_numbers not traceable to packet")

    return FindingValidationResult(is_valid=(len(errors) == 0), errors=errors)

def validate_fallback_payload(payload: Dict[str, Any], packet: Dict[str, Any]) -> FindingValidationResult:
    """
    Validates that a calculation fallback payload contains NO narrative,
    no claims, no flip conditions, has null briefing, and all key numbers
    are strictly traceable to the packet.
    """
    errors: List[str] = []
    if payload.get("ai_summary_available") is not False:
        errors.append("Fallback payload must have ai_summary_available = False")

    if payload.get("briefing") is not None:
        errors.append("Fallback payload must have briefing = None (no narrative)")

    findings = payload.get("findings", [])
    if len(findings) > 0:
        errors.append("Fallback payload must have empty findings list (no claims, no narrative)")

    valid_numbers, _ = extract_valid_numbers_from_packet(packet)
    key_numbers = payload.get("key_numbers", [])
    for item in key_numbers:
        val_str = str(item.get("value", ""))
        for num_val, token in extract_numbers_from_text(val_str):
            if is_date_or_ordinal(num_val, val_str, token):
                continue
            if not matches_number(num_val, token, valid_numbers):
                errors.append(f"Fallback key number '{token}' (value {num_val}) not found in calculation packet")

    return FindingValidationResult(is_valid=(len(errors) == 0), errors=errors)


ADVISOR_VOICE_BANNED_WORDS = [
    r"\byou should buy\b",
    r"\byou should book\b",
    r"\bwe recommend\b",
    r"\brecommend\b",
    r"\bmust buy\b",
    r"\bmust book\b",
    r"\bwalk away\b",
    r"\bavoid\b",
    r"\bskip\b",
    r"\bwait\b",
    r"\binvest\b",
    r"\bwill appreciate\b",
    r"\bguaranteed\b",
    r"\brisk[- ]free\b",
    r"\bluxury\b",
    r"\bpremium\b",
    r"\bperfect\b",
    r"\bideal\b",
    r"\bhealthy\b",
    r"\bsafe\b",
    r"\bcomfort\b",
    r"\bcomfortable\b",
]

INJECTION_PATTERNS = [
    r"<script\b",
    r"\bignore\s+(?:all\s+)?previous\s+instructions\b",
    r"\bsystem\s+prompt\b",
    r"javascript:",
    r"\bdrop\s+table\b",
    r"\bselect\s+\*\s+from\b"
]

def sanitize_user_text(text: str, max_length: int = 100) -> str:
    """Sanitises and length-caps user-supplied labels and place names."""
    if not text:
        return ""
    clean = re.sub(r"[<>{}\$\[\]`]", "", str(text)).strip()
    return clean[:max_length]

def validate_advisor_read(
    read_data: Dict[str, Any],
    packet: Optional[Dict[str, Any]] = None
) -> FindingValidationResult:
    """
    Validates complete Advisor's Read:
    - Provenance gate (>= 50% non-builder numbers, valid families, source and date required)
    - Voice gate (calm advisor persona, no purchase instructions, no banned qualitative words)
    - Diversity cap (at most 2 findings from any single family)
    - Structure gate (signature line <= 30 words, 3 matters most, tension, settle first, footer)
    - Security / injection gate on place names and labels
    """
    errors: List[str] = []
    if not isinstance(read_data, dict):
        return FindingValidationResult(is_valid=False, errors=["Advisor read must be a dictionary"])

    # 1. Structure Gate
    sig_line = read_data.get("signature_line") or ""
    if not sig_line:
        errors.append("signature_line is missing or empty")
    elif len(sig_line.split()) > 30:
        errors.append(f"signature_line word count ({len(sig_line.split())}) exceeds 30 words")

    top3 = read_data.get("what_matters_most") or []
    if len(top3) != 3:
        errors.append(f"what_matters_most must contain exactly 3 findings, found {len(top3)}")

    # Tension
    tension = read_data.get("tension") or {}
    tension_text = tension.get("text") or ""
    if not tension_text:
        errors.append("tension text is missing or empty")

    # Settle first
    settle_first = read_data.get("settle_first") or {}
    if not settle_first.get("question") or not settle_first.get("why"):
        errors.append("settle_first requires both 'question' and 'why'")

    # Footer disclaimer
    footer = read_data.get("footer") or {}
    disclaimer = footer.get("disclaimer") or ""
    if "Decision support from listed data" not in disclaimer or "Not financial, legal or investment advice" not in disclaimer:
        errors.append("Footer must contain the mandatory decision support and non-advice disclaimer")

    # 2. Provenance Gate & Diversity Cap
    family_counts: Dict[str, int] = {}
    valid_families = {"builder", "world", "market", "record", "buyer"}
    all_builder = True
    non_builder_numbers_count = 0
    total_numbers_count = 0

    for idx, item in enumerate(top3):
        fam = item.get("family", "")
        if fam not in valid_families:
            errors.append(f"Finding #{idx+1} has invalid evidence family '{fam}'")
        if fam != "builder":
            all_builder = False
            if not item.get("source") or not item.get("date"):
                errors.append(f"Finding #{idx+1} (family '{fam}') is missing source or date")

        family_counts[fam] = family_counts.get(fam, 0) + 1

        # Claim word limit <= 25 words
        claim = item.get("claim", "")
        if len(claim.split()) > 25:
            errors.append(f"Finding #{idx+1} claim exceeds 25 words ({len(claim.split())})")

        # Why word limit <= 70 words
        why = item.get("why", "")
        if len(why.split()) > 70:
            errors.append(f"Finding #{idx+1} why exceeds 70 words ({len(why.split())})")

        # For you word limit <= 40 words
        for_you = item.get("for_you")
        if for_you and len(for_you.split()) > 40:
            errors.append(f"Finding #{idx+1} for_you exceeds 40 words ({len(for_you.split())})")

        # Changes if / flip condition
        if not item.get("changes_if"):
            errors.append(f"Finding #{idx+1} is missing 'changes_if'")

        # Numbers extraction
        text_block = f"{claim} {why}"
        nums = extract_numbers_from_text(text_block)
        for val, tok in nums:
            if is_date_or_ordinal(val, text_block, tok):
                continue
            total_numbers_count += 1
            if fam != "builder":
                non_builder_numbers_count += 1

    if all_builder and len(top3) > 0:
        errors.append("Provenance gate failed: all findings have family 'builder' (outside evidence required)")

    # Diversity Cap: At most 2 selected findings from one family
    for fam, cnt in family_counts.items():
        if cnt > 2:
            errors.append(f"Diversity cap exceeded: family '{fam}' has {cnt} findings (maximum allowed is 2)")

    # Fewer than half numbers from non-builder evidence
    if total_numbers_count > 0 and (non_builder_numbers_count / float(total_numbers_count)) < 0.50:
        errors.append("Provenance gate failed: fewer than half of numbers come from non-builder evidence")

    # 3. Voice Gate
    full_text = f"{sig_line} {tension_text} {settle_first.get('question', '')} {settle_first.get('why', '')}"
    for item in top3:
        full_text += f" {item.get('claim', '')} {item.get('why', '')} {item.get('changes_if', '')}"

    for b in ADVISOR_VOICE_BANNED_WORDS:
        if re.search(b, full_text, re.IGNORECASE):
            errors.append(f"Voice gate failed: contains banned word/phrase matching '{b}'")

    for inj in INJECTION_PATTERNS:
        if re.search(inj, full_text, re.IGNORECASE):
            errors.append(f"Security gate failed: contains forbidden script/injection pattern '{inj}'")

    # Novelty Gate: Restatements check
    if re.search(r"Parks\s+score\s+best\s+at\s+4\.1", full_text, re.IGNORECASE) or re.search(r"most\s+ratings\s*\(?128\)?", full_text, re.IGNORECASE):
        errors.append("Novelty gate failed: restates displayed section grid score or ratings ('Parks score best at 4.1')")

    for b_stmt in ["Groceries are the closest daily need at 1.2 km", "From this project it is 22 minutes each way to DLF Cyber City", "The school is nearly three times as far as the supermarket"]:
        if b_stmt.lower() in full_text.lower():
            errors.append(f"Novelty gate failed: restates removed sample listing claim ('{b_stmt}')")

    return FindingValidationResult(is_valid=(len(errors) == 0), errors=errors)


