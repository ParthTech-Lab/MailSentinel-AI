from typing import Optional
from ..config import settings
from ..schemas.email import UncertaintyEvaluation

def evaluate_uncertainty(
    probabilities: dict[str, float],
    word_count: int,
    predicted_label: str
) -> UncertaintyEvaluation:
    """
    Evaluates whether the classification result meets decisive confidence thresholds.
    Triggers an uncertainty flag if:
    1. Maximum confidence is below the minimum threshold (settings.UNCERTAINTY_MIN_CONFIDENCE).
    2. The margin between the top two classes is too narrow (settings.UNCERTAINTY_MARGIN_THRESHOLD).
    3. The input text has too few words for reliable statistical vectorization (settings.UNCERTAINTY_MIN_WORD_COUNT).
    """
    sorted_probs = sorted(probabilities.values(), reverse=True)
    top_prob = sorted_probs[0] if len(sorted_probs) > 0 else 0.0
    second_prob = sorted_probs[1] if len(sorted_probs) > 1 else 0.0
    margin = round(top_prob - second_prob, 2)

    is_uncertain = False
    reasons = []

    # Check 1: Sparse token count
    if word_count < settings.UNCERTAINTY_MIN_WORD_COUNT:
        is_uncertain = True
        reasons.append(
            f"Input is too brief ({word_count} words; minimum required is {settings.UNCERTAINTY_MIN_WORD_COUNT}) "
            f"for reliable statistical TF-IDF representation."
        )

    # Check 2: Absolute confidence threshold
    if top_prob < settings.UNCERTAINTY_MIN_CONFIDENCE:
        is_uncertain = True
        reasons.append(
            f"Top model confidence ({top_prob:.1f}%) is below the decisive operational threshold of {settings.UNCERTAINTY_MIN_CONFIDENCE}%."
        )

    # Check 3: Narrow margin between competing classes
    if margin < settings.UNCERTAINTY_MARGIN_THRESHOLD:
        is_uncertain = True
        reasons.append(
            f"Probability margin between top two classes ({margin:.1f}%) is narrower than safety threshold ({settings.UNCERTAINTY_MARGIN_THRESHOLD}%)."
        )

    status_label = "Uncertain — verify manually" if is_uncertain else "Decisive"
    
    if is_uncertain:
        recommendation = (
            "The model cannot make a definitive prediction with sufficient confidence. "
            "Perform manual out-of-band verification (e.g. contact sender directly via trusted directory). "
            "Never assume an email is safe merely because no overt indicators were flagged."
        )
    else:
        recommendation = (
            f"Prediction is supported by model distribution. Note: Statistical estimates are not absolute guarantees; "
            f"remain vigilant with sensitive links or financial actions."
        )

    return UncertaintyEvaluation(
        is_uncertain=is_uncertain,
        status_label=status_label,
        reason="; ".join(reasons) if reasons else None,
        confidence_score=round(top_prob, 2),
        margin_between_top_classes=margin,
        word_count=word_count,
        recommendation=recommendation
    )

