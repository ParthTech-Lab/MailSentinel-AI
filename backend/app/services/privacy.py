import re

# Regular expressions for sensitive data redaction
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b')
OTP_TOKEN_REGEX = re.compile(r'\b(?:\d{6}|\d{8})\b')
PASSWORD_ASSIGN_REGEX = re.compile(r'(password[:=]\s*)([^\s,]+)', re.IGNORECASE)
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

def redact_sensitive_text(text: str) -> str:
    """
    Redacts explicit credentials, OTPs, payment card numbers, and SSNs from text
    prior to storing evidence or rendering previews in reports.
    """
    if not text:
        return text

    # Redact credit cards
    redacted = CREDIT_CARD_REGEX.sub("[REDACTED_CARD]", text)
    # Redact SSN
    redacted = SSN_REGEX.sub("[REDACTED_SSN]", redacted)
    # Redact passwords assignment
    redacted = PASSWORD_ASSIGN_REGEX.sub(r"\1[REDACTED_PASSWORD]", redacted)
    
    return redacted

