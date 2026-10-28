import pytest
from backend.app.schemas.email import EmailAnalyzeRequest
from backend.app.services.link_inspector import inspect_links_in_text
from backend.app.config import settings

def test_security_headers_in_response(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"

def test_rate_limit_headers_on_api(client):
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    assert "x-ratelimit-limit" in response.headers
    assert "x-ratelimit-remaining" in response.headers

def test_payload_size_limit_rejected(client):
    # Simulate oversized Content-Length header
    headers = {"Content-Length": str(settings.MAX_REQUEST_BODY_BYTES + 5000)}
    response = client.post(
        "/api/v1/analyze", 
        json={"subject": "test", "body": "test"}, 
        headers=headers
    )
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()

def test_malformed_url_safe_handling():
    text = "Check out this link: http://[::1]:namedport/invalid and http:///malformed"
    findings = inspect_links_in_text(text)
    # Shouldn't throw exceptions, handles cleanly
    assert isinstance(findings, list)

def test_oversized_text_body_pydantic_validation(client):
    # Over 50,000 characters
    huge_body = "word " * 12000
    response = client.post(
        "/api/v1/analyze",
        json={"subject": "Oversized", "body": huge_body}
    )
    assert response.status_code == 422

