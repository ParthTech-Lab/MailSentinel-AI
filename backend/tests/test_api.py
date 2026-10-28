import pytest

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_ready"] is True
    assert data["model_status"] == "trained"

def test_model_info_endpoint(client):
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "trained"
    assert "metrics" in data
    assert data["metrics"]["accuracy"] > 0.70
    assert "dataset" in data
    assert data["dataset"]["total_samples"] >= 50

def test_analyze_phishing_email(client):
    payload = {
        "subject": "URGENT: Your account access has been restricted - Verify Identity",
        "body": "Dear customer, your account will be suspended within 24 hours. Enter your password and PIN at http://192.168.1.100/verify immediately.",
        "sender": "security-alert@paypa1-fake.com"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_label"] == "phishing"
    assert data["category"] == "Phishing / Potentially Malicious"
    assert data["confidence_score"] > 50.0
    assert len(data["indicators"]) > 0
    # Verify indicator fields
    for ind in data["indicators"]:
        assert ind["is_externally_verified"] is False
    assert "not a guarantee" in data["verdict_disclaimer"].lower()

def test_analyze_clean_email(client):
    payload = {
        "subject": "Sprint Planning and User Stories",
        "body": "Good morning team, let us meet tomorrow at 10 AM to discuss the sprint backlog and Jira tasks. The project architecture document is attached.",
        "sender": "lead-dev@company.com"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_label"] == "safe"
    assert data["category"] == "Safe / Legitimate"

def test_analyze_empty_body_validation(client):
    payload = {
        "subject": "Hello",
        "body": "   "
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422

def test_batch_analyze_endpoint(client):
    payload = {
        "emails": [
            {
                "subject": "Weekly status update",
                "body": "Please review the attached project roadmap for next month."
            },
            {
                "subject": "Congratulations winner! Claim free prize",
                "body": "You won $5,000 cash prize! Claim your 100% free Walmart gift card now."
            }
        ]
    }
    response = client.post("/api/v1/analyze/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_submitted"] == 2
    assert data["total_analyzed"] == 2
    assert len(data["results"]) == 2

def test_batch_analyze_exceed_limit(client):
    # Exceed limit of 50
    excessive_emails = [
        {"subject": f"Email {i}", "body": f"Sample content {i}"}
        for i in range(51)
    ]
    response = client.post("/api/v1/analyze/batch", json={"emails": excessive_emails})
    assert response.status_code == 422
