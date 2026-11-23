"""
Advisor Materiality Weights and Confidence Tiers configuration.
All weights and tiers reside in this single configuration module.
"""

MATERIALITY_WEIGHTS = {
    "effect_size": 0.35,
    "relevance": 0.25,
    "confidence": 0.20,
    "actionability": 0.20,
}

CONFIDENCE_TIERS = {
    "official_record": 0.9,
    "mapped": 0.7,
    "modelled": 0.6,
    "assumed_heavy": 0.4,
}

# Relevance constants
RELEVANCE_MATCHED_PRIORITY = 1.0
RELEVANCE_NO_PROFILE = 0.5
RELEVANCE_UNMATCHED = 0.2

# Diversity cap
MAX_FINDINGS_PER_FAMILY = 2
TOP_MATTERS_MOST_COUNT = 3

def calculate_materiality(
    effect_size: float,
    relevance: float,
    confidence: float,
    actionability: float
) -> float:
    """
    Computes materiality score:
    0.35 * effect_size + 0.25 * relevance + 0.20 * confidence + 0.20 * actionability
    """
    score = (
        MATERIALITY_WEIGHTS["effect_size"] * max(0.0, min(1.0, effect_size)) +
        MATERIALITY_WEIGHTS["relevance"] * max(0.0, min(1.0, relevance)) +
        MATERIALITY_WEIGHTS["confidence"] * max(0.0, min(1.0, confidence)) +
        MATERIALITY_WEIGHTS["actionability"] * max(0.0, min(1.0, actionability))
    )
    return round(score, 4)
