from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime, timezone

class EmailAnalyzeRequest(BaseModel):
    subject: str = Field(default="", max_length=500, description="Subject line of the email")
    body: str = Field(..., min_length=1, max_length=50000, description="Email body text or MIME content")
    sender: Optional[str] = Field(default=None, max_length=320, description="Sender email address (From header)")
    headers: Optional[str] = Field(default=None, max_length=10000, description="Optional raw email headers")
    opt_in_history: bool = Field(default=False, description="User opt-in to retain anonymous scan summary in local history")
    redact_sensitive: bool = Field(default=True, description="Automatically redact credit cards, OTPs, and passwords from evidence previews")

    @field_validator("body")
    @classmethod
    def validate_body_not_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Email body cannot be empty or solely whitespace.")
        return v

class SuspiciousIndicator(BaseModel):
    category: str = Field(..., description="Classification category of the indicator")
    title: str = Field(..., description="Short descriptive title of the finding")
    description: str = Field(..., description="Detailed explanation of the heuristic")
    evidence: list[str] = Field(default_factory=list, description="Specific terms, tokens, or links extracted from the text")
    severity: Literal["info", "low", "medium", "high", "critical"] = Field(..., description="Assessed threat severity")
    is_externally_verified: bool = Field(
        default=False, 
        description="Whether this finding was confirmed via external verification service (SPF/DKIM/DNS). Set to False for local text heuristics."
    )

class UrlInspectionFinding(BaseModel):
    raw_url: str
    scheme: str
    hostname: str
    path: str
    port: Optional[int] = None
    is_ip_address: bool = False
    has_lookalike_domain: bool = False
    suspicious_tld: bool = False
    indicators: list[str] = Field(default_factory=list)
    severity: Literal["clean", "low", "medium", "high", "critical"]
    disclaimer: str = Field(
        default="Preliminary syntactic inspection. Link destinations, redirects, and live malware signatures were not externally fetched."
    )

class BrandImpersonationFinding(BaseModel):
    brand_name: str
    mentioned_brand: str
    sender_provided: bool
    sender_domain: Optional[str] = None
    legitimate_domains: list[str] = Field(default_factory=list)
    is_mismatch: bool
    confidence_assessment: Literal["confirmed_mismatch", "unverified_sender", "clean_or_unmentioned"]
    explanation: str

class ScamPatternFingerprint(BaseModel):
    fingerprint_hash: str
    normalized_features: list[str] = Field(default_factory=list)
    cluster_pattern: str
    disclaimer: str = Field(
        default="Local session fingerprint. Cross-tenant or global intelligence matching requires an active external threat intelligence connector."
    )

class ThreatTimelineStep(BaseModel):
    step_number: int
    name: str
    status: Literal["completed", "flagged", "bypassed", "failed"]
    duration_ms: float
    details: str

class UncertaintyEvaluation(BaseModel):
    is_uncertain: bool
    status_label: Literal["Decisive", "Uncertain — verify manually"]
    reason: Optional[str] = None
    confidence_score: float
    margin_between_top_classes: float
    word_count: int
    recommendation: str

class EmailAnalyzeResponse(BaseModel):
    id: str = Field(..., description="Unique analysis transaction ID")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    sender: Optional[str] = None
    subject: str
    category: Literal["Safe / Legitimate", "Spam", "Phishing / Potentially Malicious"]
    predicted_label: Literal["safe", "spam", "phishing"]
    confidence_score: float = Field(..., ge=0.0, le=100.0, description="Calibrated model confidence percentage")
    probabilities: dict[str, float] = Field(..., description="Probability distribution across all target categories")
    verdict_disclaimer: str = Field(
        default="Model confidence is an estimated statistical probability based on textual patterns, not a guarantee of email safety or legitimacy."
    )
    explanation: str = Field(..., description="Human-understandable summary of classification rationale")
    indicators: list[SuspiciousIndicator] = Field(default_factory=list, description="Evidence-based linguistic and structural findings")
    
    # Advanced Intelligence Fields (Prompt 3)
    uncertainty: UncertaintyEvaluation
    brand_radar: Optional[BrandImpersonationFinding] = None
    inspected_links: list[UrlInspectionFinding] = Field(default_factory=list)
    fingerprint: ScamPatternFingerprint
    threat_timeline: list[ThreatTimelineStep] = Field(default_factory=list)
    privacy_shield_applied: bool = True
    
    extracted_features: dict[str, object] = Field(default_factory=dict, description="Metadata feature summary")

class BatchAnalyzeRequest(BaseModel):
    emails: list[EmailAnalyzeRequest] = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="List of emails to analyze concurrently (max 50 per batch)"
    )

class BatchAnalyzeResponse(BaseModel):
    total_submitted: int
    total_analyzed: int
    results: list[EmailAnalyzeResponse]
