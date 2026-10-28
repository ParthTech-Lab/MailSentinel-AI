import re
from typing import Optional
from ..schemas.email import SuspiciousIndicator

# Regular expressions for heuristics
URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+', re.IGNORECASE)
IP_URL_REGEX = re.compile(r'https?://(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:/[^\s]*)?', re.IGNORECASE)
LOOKALIKE_REGEX = re.compile(r'(?:paypa[1l]|micr[o0]s[o0]ft|g[o0]{2}gle|app[1l]e|amaz[o0]n|netf[1l]ix)[a-z0-9\-]*\.(?:com|net|org|xyz|top|biz|info|cc)', re.IGNORECASE)

URGENCY_PATTERNS = [
    (r'\b(?:urgent|immediately|immediate action|right away|within \d+ (?:hours?|minutes?)|24 hours|48 hours)\b', 'Immediate time constraint'),
    (r'\b(?:account (?:will be |has been )?(?:suspended|locked|terminated|disabled|restricted))\b', 'Account suspension / restriction threat'),
    (r'\b(?:final notice|last chance|warning:? account|permanent closure)\b', 'Punitive consequence warning'),
    (r'\b(?:unauthorized (?:sign-in|activity|transaction|access)|security alert)\b', 'Fabricated security panic trigger')
]

CREDENTIAL_FINANCIAL_PATTERNS = [
    (r'\b(?:enter|verify|confirm|update|submit)\s+(?:your\s+)?(?:password|pin|passcode|credentials|login details)\b', 'Credential disclosure request'),
    (r'\b(?:one-time password|otp|verification code|2fa code|security token)\b', 'Two-factor / OTP disclosure request'),
    (r'\b(?:credit card|debit card|cvv|expir(?:y|ation) date|card number)\b', 'Payment card details request'),
    (r'\b(?:bank account|routing number|ssn|social security|wire transfer|cryptocurrency|bitcoin)\b', 'Sensitive financial data prompt')
]

SPAM_PATTERNS = [
    (r'\b(?:100% free|completely free|risk[- ]free|free trial|money[- ]back guarantee)\b', 'Promotional guarantee language'),
    (r'\b(?:congratulations!? you (?:have )?won|winner|chosen to receive|claim your prize|lottery jackpot)\b', 'Unsolicited sweepstakes / prize claim'),
    (r'\b(?:make money fast|earn \$\d+|passive income|work from home opportunity)\b', 'Financial solicitation / get-rich pitch'),
    (r'\b(?:limited time offer|act now|exclusive deal|discount code|lowest price)\b', 'High-pressure retail promotional vocabulary')
]

KNOWN_BRANDS = [
    ('paypal', r'\b(?:paypal|paypa1)\b'),
    ('microsoft', r'\b(?:microsoft|office 365|outlook|onedrive)\b'),
    ('google', r'\b(?:google|gmail|google drive)\b'),
    ('apple', r'\b(?:apple|icloud|apple id)\b'),
    ('amazon', r'\b(?:amazon|prime)\b'),
    ('netflix', r'\b(?:netflix)\b'),
    ('chase', r'\b(?:chase bank)\b'),
    ('wellsfargo', r'\b(?:wells fargo)\b')
]

def extract_features(text: str, sender: Optional[str] = None) -> dict[str, object]:
    """Extract descriptive textual metrics from the email content."""
    urls = URL_REGEX.findall(text)
    ip_urls = IP_URL_REGEX.findall(text)
    words = re.findall(r'\b\w+\b', text)
    
    return {
        "character_count": len(text),
        "word_count": len(words),
        "url_count": len(urls),
        "has_ip_url": len(ip_urls) > 0,
        "sample_urls": urls[:3],
        "sender_provided": sender is not None and bool(sender.strip()),
    }

def analyze_explainability(
    subject: str,
    body: str,
    sender: Optional[str] = None,
    ml_predicted_label: str = "safe"
) -> tuple[list[SuspiciousIndicator], str]:
    """
    Produce explainable, evidence-based findings strictly from textual content.
    Clarifies that external reputation verification is not performed.
    """
    full_text = f"{subject}\n{body}".strip()
    indicators: list[SuspiciousIndicator] = []

    # 1. Suspicious Urgency and Threats
    found_urgency = []
    for pattern, label in URGENCY_PATTERNS:
        matches = re.findall(pattern, full_text, re.IGNORECASE)
        if matches:
            found_urgency.extend(matches[:2])
    if found_urgency:
        indicators.append(SuspiciousIndicator(
            category="urgency_coercion",
            title="Urgent or Threatening Language Detected",
            description="The email applies high urgency, countdown deadlines, or account suspension warnings often used in coercion attacks.",
            evidence=list(set(found_urgency))[:4],
            severity="high" if ml_predicted_label == "phishing" else "medium",
            is_externally_verified=False
        ))

    # 2. Credential or Financial Requests
    found_credentials = []
    for pattern, label in CREDENTIAL_FINANCIAL_PATTERNS:
        matches = re.findall(pattern, full_text, re.IGNORECASE)
        if matches:
            found_credentials.extend(matches[:2])
    if found_credentials:
        indicators.append(SuspiciousIndicator(
            category="credential_harvesting",
            title="Credential or Sensitive Data Solicitation",
            description="The message solicits passwords, PINs, OTP tokens, or banking details—unusual for legitimate automated notifications.",
            evidence=list(set(found_credentials))[:4],
            severity="critical",
            is_externally_verified=False
        ))

    # 3. Suspicious Links or Insecure URLs
    urls = URL_REGEX.findall(full_text)
    ip_urls = IP_URL_REGEX.findall(full_text)
    lookalike_urls = [u for u in urls if LOOKALIKE_REGEX.search(u)]

    if ip_urls:
        indicators.append(SuspiciousIndicator(
            category="insecure_url",
            title="Direct IP-Address Link Embedded",
            description="Email contains hyperlink(s) pointing to raw numerical IP addresses rather than registered hostnames, commonly seen in credential phishing hosts.",
            evidence=ip_urls[:3],
            severity="critical",
            is_externally_verified=False
        ))
    elif lookalike_urls:
        indicators.append(SuspiciousIndicator(
            category="typosquatting_link",
            title="Potential Lookalike Domain in URL",
            description="Hyperlink uses deceptive character substitutions (e.g., paypa1, 0 instead of o) characteristic of typosquatting attacks.",
            evidence=lookalike_urls[:3],
            severity="critical",
            is_externally_verified=False
        ))
    elif any(u.startswith("http://") for u in urls):
        insecure_http = [u for u in urls if u.startswith("http://")][:3]
        indicators.append(SuspiciousIndicator(
            category="insecure_protocol",
            title="Unencrypted HTTP Link Detected",
            description="Inbound email contains unencrypted (HTTP) links where modern services strictly employ HTTPS for sensitive destinations.",
            evidence=insecure_http,
            severity="medium",
            is_externally_verified=False
        ))

    # 4. Spam-Like Language
    found_spam = []
    for pattern, label in SPAM_PATTERNS:
        matches = re.findall(pattern, full_text, re.IGNORECASE)
        if matches:
            found_spam.extend(matches[:2])
    if found_spam:
        indicators.append(SuspiciousIndicator(
            category="spam_vocabulary",
            title="Unsolicited Bulk / Promotional Vocabulary",
            description="Text exhibits terms typical of mass marketing, unsolicited prize claims, or commercial bulk email.",
            evidence=list(set(found_spam))[:4],
            severity="medium" if ml_predicted_label == "spam" else "low",
            is_externally_verified=False
        ))

    # 5. Sender / Brand Mismatch Anomaly (Text-based heuristic)
    if sender and sender.strip():
        sender_clean = sender.lower().strip()
        sender_domain = sender_clean.split("@")[-1] if "@" in sender_clean else ""
        
        for brand_key, brand_pattern in KNOWN_BRANDS:
            if re.search(brand_pattern, full_text, re.IGNORECASE):
                # If brand mentioned but sender domain clearly differs
                if sender_domain and brand_key not in sender_domain:
                    # Check if sender is free webmail
                    is_free_mail = any(p in sender_domain for p in ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "mail.com"])
                    indicators.append(SuspiciousIndicator(
                        category="sender_brand_mismatch",
                        title=f"Potential Brand Impersonation ({brand_key.title()})",
                        description=f"Message mentions {brand_key.title()}, yet originating sender address '{sender}' appears hosted on an unrelated domain ({sender_domain or 'unknown'}). Note: this is a textual heuristic; SPF/DKIM authentication was not checked.",
                        evidence=[f"Sender: {sender}", f"Referenced brand: {brand_key}"],
                        severity="high" if is_free_mail else "medium",
                        is_externally_verified=False
                    ))
                    break

    # Synthesize human-readable explanation
    if ml_predicted_label == "phishing":
        reasons = [ind.title for ind in indicators if ind.severity in ("critical", "high")]
        summary = (
            f"Classified as Phishing / Potentially Malicious. The model identified high-risk patterns "
            f"associated with credential theft or social engineering: {', '.join(reasons) if reasons else 'structural and lexical threat patterns'}. "
            f"Avoid clicking any included links or providing credentials."
        )
    elif ml_predicted_label == "spam":
        summary = (
            "Classified as Spam. The email exhibits vocabulary and structure characteristic of "
            "unsolicited bulk mail, commercial advertising, or promotional broadcasts."
        )
    else:
        if indicators:
            summary = (
                "Classified as Safe / Legitimate by the machine learning model. While some minor heuristic flags "
                "were noted, the overall lexical structure aligns with standard business communication."
            )
        else:
            summary = (
                "Classified as Safe / Legitimate. No malicious triggers, high-urgency threats, or deceptive "
                "credential harvesting links were detected in the message text."
            )

    return indicators, summary

