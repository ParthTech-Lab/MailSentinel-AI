import json
import time
import uuid
from typing import Optional
import joblib
import numpy as np

from ..config import settings
from ..schemas.email import (
    EmailAnalyzeResponse,
    ThreatTimelineStep
)
from ..schemas.model import ModelInfoResponse, ModelEvaluationMetrics, DatasetMetadata
from .explainability import analyze_explainability, extract_features
from .link_inspector import inspect_links_in_text
from .brand_radar import evaluate_brand_impersonation
from .fingerprinter import generate_scam_fingerprint
from .uncertainty_guard import evaluate_uncertainty
from .privacy import redact_sensitive_text

CATEGORY_MAP = {
    "safe": "Safe / Legitimate",
    "spam": "Spam",
    "phishing": "Phishing / Potentially Malicious",
}

class EmailClassifierService:
    def __init__(self):
        self.pipeline = None
        self.metadata = None
        self.load_model()

    def load_model(self):
        """Loads trained pipeline and metrics from disk."""
        if settings.MODEL_PATH.exists():
            try:
                self.pipeline = joblib.load(settings.MODEL_PATH)
            except Exception as e:
                print(f"Error loading model from {settings.MODEL_PATH}: {e}")
                self.pipeline = None
        else:
            self.pipeline = None

        if settings.METRICS_PATH.exists():
            try:
                with open(settings.METRICS_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"Error loading metrics from {settings.METRICS_PATH}: {e}")
                self.metadata = None
        else:
            self.metadata = None

    @property
    def is_trained(self) -> bool:
        return self.pipeline is not None

    def get_info(self) -> ModelInfoResponse:
        """Returns current operational status and evaluation metrics."""
        if not self.is_trained:
            return ModelInfoResponse(
                status="uninitialized",
                version=settings.APP_VERSION,
                algorithm="Uninitialized (Execute train.py to build model)",
                vectorizer="None",
                target_classes=["safe", "spam", "phishing"],
                trained_at=None,
                dataset=None,
                metrics=None
            )

        meta = self.metadata or {}
        dataset_meta = None
        if "dataset" in meta:
            d = meta["dataset"]
            dataset_meta = DatasetMetadata(
                name=d.get("name", "Unknown"),
                description=d.get("description", ""),
                total_samples=d.get("total_samples", 0),
                distribution=d.get("distribution", {}),
                sources=d.get("sources", []),
            )

        metrics_data = None
        if "metrics" in meta:
            m = meta["metrics"]
            metrics_data = ModelEvaluationMetrics(
                accuracy=m.get("accuracy", 0.0),
                macro_precision=m.get("macro_precision", 0.0),
                macro_recall=m.get("macro_recall", 0.0),
                macro_f1=m.get("macro_f1", 0.0),
                weighted_f1=m.get("weighted_f1", 0.0),
                per_class=m.get("per_class", {}),
                confusion_matrix=m.get("confusion_matrix", []),
                evaluated_samples=m.get("evaluated_samples", 0),
            )

        return ModelInfoResponse(
            status="trained",
            version=meta.get("version", settings.APP_VERSION),
            algorithm=meta.get("algorithm", "TF-IDF + Logistic Regression"),
            vectorizer=meta.get("vectorizer", "TfidfVectorizer"),
            target_classes=meta.get("target_classes", ["safe", "spam", "phishing"]),
            trained_at=meta.get("trained_at"),
            dataset=dataset_meta,
            metrics=metrics_data,
        )

    def analyze(
        self,
        subject: str,
        body: str,
        sender: Optional[str] = None,
        headers: Optional[str] = None,
        redact_sensitive: bool = True
    ) -> EmailAnalyzeResponse:
        """
        Executes full multi-stage threat intelligence workflow:
        1. Input validation & privacy redaction check
        2. Safe URL extraction & link inspection
        3. Brand impersonation radar
        4. Scikit-learn TF-IDF model inference
        5. Rule-based explainability & evidence extraction
        6. AI uncertainty guard evaluation
        7. Scam pattern fingerprint generation
        8. Audit timeline step recording
        """
        if not self.is_trained:
            raise RuntimeError(
                "Classification model is uninitialized. The model must be trained using the documented dataset before serving predictions."
            )

        timeline: list[ThreatTimelineStep] = []
        overall_start = time.perf_counter()

        # Step 1: Input Validation & Ingestion
        s1_start = time.perf_counter()
        full_text = f"{subject.strip()}\n{body.strip()}".strip()
        word_count = len(full_text.split())
        s1_duration = round((time.perf_counter() - s1_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=1,
            name="Input Ingestion & Validation",
            status="completed",
            duration_ms=s1_duration,
            details=f"Validated payload ({len(full_text)} chars, {word_count} words). In-memory ephemeral stream."
        ))

        # Step 2: Link Journey Inspector
        s2_start = time.perf_counter()
        inspected_links = inspect_links_in_text(full_text)
        has_critical_links = any(link.severity in ("critical", "high") for link in inspected_links)
        s2_duration = round((time.perf_counter() - s2_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=2,
            name="Link Journey Inspector",
            status="flagged" if has_critical_links else "completed",
            duration_ms=s2_duration,
            details=f"Extracted {len(inspected_links)} unique URLs. Static syntactic parsing (0 HTTP requests issued)."
        ))

        # Step 3: Brand Impersonation Radar
        s3_start = time.perf_counter()
        brand_finding = evaluate_brand_impersonation(full_text, sender)
        is_brand_flagged = brand_finding is not None and brand_finding.is_mismatch
        s3_duration = round((time.perf_counter() - s3_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=3,
            name="Brand Impersonation Radar",
            status="flagged" if is_brand_flagged else "completed",
            duration_ms=s3_duration,
            details=(
                f"Evaluated brand signatures against {len(settings.MONITORED_BRANDS)} monitored organizations. "
                + (f"Referenced: {brand_finding.brand_name}." if brand_finding else "No monitored brands mentioned.")
            )
        ))

        # Step 4: Machine Learning Inference
        s4_start = time.perf_counter()
        probabilities_raw = self.pipeline.predict_proba([full_text])[0]
        classes = list(self.pipeline.classes_)
        prob_dict = {
            cls: round(float(probabilities_raw[idx]) * 100.0, 2)
            for idx, cls in enumerate(classes)
        }
        best_idx = int(np.argmax(probabilities_raw))
        best_label = str(classes[best_idx])
        confidence = float(prob_dict[best_label])
        s4_duration = round((time.perf_counter() - s4_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=4,
            name="Machine Learning Inference",
            status="completed",
            duration_ms=s4_duration,
            details=f"Computed TF-IDF vector & regularized probability. Top class: {best_label} ({confidence:.1f}%)."
        ))

        # Step 5: Rule-Based Evidence Extraction & Explainability
        s5_start = time.perf_counter()
        raw_indicators, explanation = analyze_explainability(
            subject=subject,
            body=body,
            sender=sender,
            ml_predicted_label=best_label
        )
        
        # Privacy Redaction for evidence snippets
        indicators = []
        for ind in raw_indicators:
            redacted_evidence = [
                redact_sensitive_text(ev) if redact_sensitive else ev
                for ev in ind.evidence
            ]
            indicators.append(ind.model_copy(update={"evidence": redacted_evidence}))

        s5_duration = round((time.perf_counter() - s5_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=5,
            name="Rule-Based Evidence Extraction",
            status="flagged" if len(indicators) > 0 else "completed",
            duration_ms=s5_duration,
            details=f"Extracted {len(indicators)} explainable evidence indicators with text snippet anchors."
        ))

        # Step 6: AI Uncertainty Guard
        s6_start = time.perf_counter()
        uncertainty = evaluate_uncertainty(
            probabilities=prob_dict,
            word_count=word_count,
            predicted_label=best_label
        )
        s6_duration = round((time.perf_counter() - s6_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=6,
            name="AI Uncertainty Guard",
            status="flagged" if uncertainty.is_uncertain else "completed",
            duration_ms=s6_duration,
            details=f"Status: {uncertainty.status_label}. Margin: {uncertainty.margin_between_top_classes}%."
        ))

        # Step 7: Scam Pattern Fingerprinting
        s7_start = time.perf_counter()
        detected_brand_key = brand_finding.mentioned_brand if brand_finding else None
        fingerprint = generate_scam_fingerprint(
            word_count=word_count,
            predicted_label=best_label,
            indicators=indicators,
            urls=inspected_links,
            detected_brand=detected_brand_key
        )
        s7_duration = round((time.perf_counter() - s7_start) * 1000, 2)
        timeline.append(ThreatTimelineStep(
            step_number=7,
            name="Scam Pattern Fingerprinting",
            status="completed",
            duration_ms=s7_duration,
            details=f"Normalized hash: {fingerprint.fingerprint_hash} ({fingerprint.cluster_pattern})."
        ))

        features = extract_features(full_text, sender)
        if headers:
            features["headers_length"] = len(headers)

        return EmailAnalyzeResponse(
            id=f"scan_{uuid.uuid4().hex[:12]}",
            sender=sender,
            subject=subject,
            category=CATEGORY_MAP.get(best_label, "Safe / Legitimate"),
            predicted_label=best_label,
            confidence_score=confidence,
            probabilities=prob_dict,
            explanation=explanation,
            indicators=indicators,
            uncertainty=uncertainty,
            brand_radar=brand_finding,
            inspected_links=inspected_links,
            fingerprint=fingerprint,
            threat_timeline=timeline,
            privacy_shield_applied=redact_sensitive,
            extracted_features=features
        )

classifier_service = EmailClassifierService()
