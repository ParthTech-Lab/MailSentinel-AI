from backend.app.services.classifier import classifier_service
from backend.app.services.explainability import analyze_explainability, extract_features

def test_classifier_is_loaded():
    assert classifier_service.is_trained is True

def test_explainability_extracts_urgency_and_credentials():
    subject = "Account Suspended Immediately"
    body = "Your password will expire. Enter your PIN and credit card details at http://10.0.0.1/auth."
    indicators, explanation = analyze_explainability(subject, body, sender="support@unknown.com", ml_predicted_label="phishing")
    
    categories = [ind.category for ind in indicators]
    assert "urgency_coercion" in categories
    assert "credential_harvesting" in categories
    assert "insecure_url" in categories
    assert "Phishing" in explanation

def test_feature_extraction():
    text = "Check this link https://example.com/login and http://192.168.1.1/admin"
    features = extract_features(text, sender="admin@example.com")
    assert features["url_count"] == 2
    assert features["has_ip_url"] is True
    assert features["sender_provided"] is True

