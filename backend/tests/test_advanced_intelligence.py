import pytest
from backend.app.services.link_inspector import inspect_links_in_text
from backend.app.services.brand_radar import evaluate_brand_impersonation
from backend.app.services.fingerprinter import generate_scam_fingerprint
from backend.app.services.uncertainty_guard import evaluate_uncertainty
from backend.app.services.privacy import redact_sensitive_text
from backend.app.services.classifier import classifier_service
from backend.app.schemas.email import SuspiciousIndicator, UrlInspectionFinding

def test_link_inspector_detects_ip_address():
    text = "Please log in to your account here: http://192.168.1.55/auth/login to confirm details."
    findings = inspect_links_in_text(text)
    assert len(findings) == 1
    f = findings[0]
    assert f.is_ip_address is True
    assert f.hostname == "192.168.1.55"
    assert f.severity == "critical"
    assert any("numerical IPv4" in ind for ind in f.indicators)

def test_link_inspector_detects_lookalike_and_risky_tld():
    text = "Visit http://paypa1-security-desk.xyz/verify for account activation."
    findings = inspect_links_in_text(text)
    assert len(findings) == 1
    f = findings[0]
    assert f.has_lookalike_domain is True
    assert f.suspicious_tld is True
    assert f.severity in ("critical", "high")

def test_brand_radar_detects_mismatch_with_free_webmail():
    text = "This is PayPal Security Notice. Your balance is on hold."
    sender = "security-officer@gmail.com"
    finding = evaluate_brand_impersonation(text, sender)
    assert finding is not None
    assert finding.is_mismatch is True
    assert finding.confidence_assessment == "confirmed_mismatch"
    assert "free public webmail" in finding.explanation

def test_brand_radar_legitimate_domain_match():
    text = "This is a statement from your PayPal merchant ledger."
    sender = "notifications@paypal.com"
    finding = evaluate_brand_impersonation(text, sender)
    assert finding is not None
    assert finding.is_mismatch is False
    assert finding.confidence_assessment == "clean_or_unmentioned"

def test_brand_radar_unverified_sender():
    text = "This is an alert regarding your Netflix subscription."
    finding = evaluate_brand_impersonation(text, sender=None)
    assert finding is not None
    assert finding.sender_provided is False
    assert finding.confidence_assessment == "unverified_sender"

def test_uncertainty_guard_flags_sparse_input():
    # Only 3 words
    probs = {"safe": 52.0, "spam": 30.0, "phishing": 18.0}
    unc = evaluate_uncertainty(probabilities=probs, word_count=3, predicted_label="safe")
    assert unc.is_uncertain is True
    assert "Uncertain" in unc.status_label
    assert "too brief" in (unc.reason or "")

def test_uncertainty_guard_flags_narrow_margin():
    # Close margin (45% vs 40%)
    probs = {"safe": 45.0, "spam": 40.0, "phishing": 15.0}
    unc = evaluate_uncertainty(probabilities=probs, word_count=50, predicted_label="safe")
    assert unc.is_uncertain is True
    assert "margin" in (unc.reason or "").lower()

def test_fingerprint_is_stable_and_deterministic():
    indicators = [
        SuspiciousIndicator(
            category="urgency_coercion",
            title="Urgency",
            description="High urgency",
            evidence=["within 24 hours"],
            severity="high"
        )
    ]
    urls = [
        UrlInspectionFinding(
            raw_url="http://192.168.1.1/login",
            scheme="http",
            hostname="192.168.1.1",
            path="/login",
            is_ip_address=True,
            severity="critical"
        )
    ]
    fp1 = generate_scam_fingerprint(120, "phishing", indicators, urls, "paypal")
    fp2 = generate_scam_fingerprint(120, "phishing", indicators, urls, "paypal")
    assert fp1.fingerprint_hash == fp2.fingerprint_hash
    assert fp1.cluster_pattern == "credential_harvest_lure"

def test_privacy_redacts_credit_card_and_password():
    text = "Card: 4111 2222 3333 4444. Password: MySecretPassword123, SSN: 000-12-3456"
    redacted = redact_sensitive_text(text)
    assert "4111 2222 3333 4444" not in redacted
    assert "[REDACTED_CARD]" in redacted
    assert "MySecretPassword123" not in redacted
    assert "[REDACTED_PASSWORD]" in redacted
    assert "[REDACTED_SSN]" in redacted

def test_full_analysis_contains_all_prompt3_features():
    subject = "Urgent: PayPal Account Access Restricted"
    body = "Your account will be suspended within 24 hours. Verify password at http://paypa1-security.xyz/login immediately."
    sender = "security@gmail.com"
    
    res = classifier_service.analyze(subject, body, sender=sender, redact_sensitive=True)
    assert res.brand_radar is not None
    assert res.brand_radar.is_mismatch is True
    assert len(res.inspected_links) == 1
    assert res.inspected_links[0].has_lookalike_domain is True
    assert res.fingerprint.fingerprint_hash.startswith("fp_")
    assert len(res.threat_timeline) >= 6
    assert res.uncertainty is not None

