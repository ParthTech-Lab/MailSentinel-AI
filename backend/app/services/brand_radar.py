import re
from typing import Optional
from ..config import settings
from ..schemas.email import BrandImpersonationFinding

def evaluate_brand_impersonation(
    text: str,
    sender: Optional[str] = None
) -> Optional[BrandImpersonationFinding]:
    """
    Scans email text for monitored brand references and evaluates whether
    the provided sender domain matches known legitimate brand domains.
    Provides transparent, text-based heuristics without claiming external SPF/DKIM verification.
    """
    text_lower = text.lower()
    
    # 1. Identify if any monitored brand is mentioned
    detected_brand_key = None
    for brand_key in settings.MONITORED_BRANDS.keys():
        # Match whole word boundary
        if re.search(r'\b' + re.escape(brand_key) + r'\b', text_lower):
            detected_brand_key = brand_key
            break

    if not detected_brand_key:
        return None

    legitimate_domains = settings.MONITORED_BRANDS[detected_brand_key]
    brand_display_name = detected_brand_key.title()

    # If sender was not provided by user
    if not sender or not sender.strip():
        return BrandImpersonationFinding(
            brand_name=brand_display_name,
            mentioned_brand=detected_brand_key,
            sender_provided=False,
            sender_domain=None,
            legitimate_domains=legitimate_domains,
            is_mismatch=False,
            confidence_assessment="unverified_sender",
            explanation=(
                f"The message references {brand_display_name}, but no originating sender address (From header) "
                f"was supplied for domain comparison. Always inspect the originating address."
            )
        )

    # Clean sender domain
    sender_clean = sender.lower().strip()
    sender_domain = sender_clean.split("@")[-1] if "@" in sender_clean else sender_clean

    # Check if sender matches legitimate domains
    is_legitimate_match = any(
        sender_domain == legit or sender_domain.endswith("." + legit)
        for legit in legitimate_domains
    )

    if is_legitimate_match:
        return BrandImpersonationFinding(
            brand_name=brand_display_name,
            mentioned_brand=detected_brand_key,
            sender_provided=True,
            sender_domain=sender_domain,
            legitimate_domains=legitimate_domains,
            is_mismatch=False,
            confidence_assessment="clean_or_unmentioned",
            explanation=(
                f"Originating sender domain '{sender_domain}' aligns with known domain records for {brand_display_name}. "
                f"Note: This is a domain name match; cryptographic SPF/DKIM gateway verification was not performed."
            )
        )

    # Check if sender domain is a free webmail provider
    is_free_mail = any(sender_domain == fm or sender_domain.endswith("." + fm) for fm in settings.FREE_WEBMAIL_DOMAINS)

    if is_free_mail:
        explanation = (
            f"High-risk brand mismatch: Email mentions {brand_display_name}, but originating sender domain '{sender_domain}' "
            f"is a free public webmail service. Legitimate enterprise communications originate from official organization domains."
        )
    else:
        explanation = (
            f"Possible brand mismatch: Email mentions {brand_display_name}, but sender domain '{sender_domain}' does not "
            f"match known authorized domains ({', '.join(legitimate_domains[:2])}). "
            f"Verify out-of-band before taking action. Note: Rule-based finding, not confirmed fraud."
        )

    return BrandImpersonationFinding(
        brand_name=brand_display_name,
        mentioned_brand=detected_brand_key,
        sender_provided=True,
        sender_domain=sender_domain,
        legitimate_domains=legitimate_domains,
        is_mismatch=True,
        confidence_assessment="confirmed_mismatch",
        explanation=explanation
    )

