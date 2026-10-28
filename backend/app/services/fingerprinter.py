import hashlib
import re
from typing import Optional
from ..schemas.email import ScamPatternFingerprint, SuspiciousIndicator, UrlInspectionFinding

def generate_scam_fingerprint(
    word_count: int,
    predicted_label: str,
    indicators: list[SuspiciousIndicator],
    urls: list[UrlInspectionFinding],
    detected_brand: Optional[str] = None
) -> ScamPatternFingerprint:
    """
    Computes a deterministic, non-sensitive structural fingerprint of the email.
    Uses normalized feature tiers and threat categories rather than raw email body text,
    ensuring privacy while enabling pattern cluster matching.
    """
    # 1. Normalized length tier
    if word_count < 20:
        len_tier = "len_micro"
    elif word_count < 80:
        len_tier = "len_short"
    elif word_count < 250:
        len_tier = "len_medium"
    else:
        len_tier = "len_long"

    # 2. Normalized indicator categories
    ind_cats = sorted(list(set(ind.category for ind in indicators)))
    
    # 3. URL syntactic traits
    url_traits = []
    if any(u.is_ip_address for u in urls):
        url_traits.append("has_ip_host")
    if any(u.has_lookalike_domain for u in urls):
        url_traits.append("has_lookalike_url")
    if any(u.suspicious_tld for u in urls):
        url_traits.append("has_risky_tld")
    if any(u.scheme == "http" for u in urls):
        url_traits.append("has_http_link")

    # 4. Brand trait
    brand_trait = f"brand_{detected_brand}" if detected_brand else "brand_none"

    # Assemble normalized feature list
    features = [
        f"label_{predicted_label}",
        len_tier,
        brand_trait
    ] + [f"cat_{c}" for c in ind_cats] + url_traits

    # Compute stable hash
    feature_string = "|".join(sorted(features))
    fingerprint_hash = f"fp_{hashlib.sha256(feature_string.encode('utf-8')).hexdigest()[:16]}"

    # Determine cluster pattern classification
    if "has_ip_host" in url_traits or "cat_credential_harvesting" in features:
        cluster = "credential_harvest_lure"
    elif "has_lookalike_url" in url_traits or "cat_sender_brand_mismatch" in features:
        cluster = "brand_impersonation_campaign"
    elif "cat_urgency_coercion" in features:
        cluster = "urgent_account_restriction_lure"
    elif "cat_spam_vocabulary" in features:
        cluster = "unsolicited_commercial_bulk"
    elif predicted_label == "safe":
        cluster = "standard_business_correspondence"
    else:
        cluster = "unclassified_threat_pattern"

    return ScamPatternFingerprint(
        fingerprint_hash=fingerprint_hash,
        normalized_features=features,
        cluster_pattern=cluster
    )

