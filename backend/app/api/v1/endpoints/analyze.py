from fastapi import APIRouter, HTTPException, status
from ....schemas.email import (
    EmailAnalyzeRequest,
    EmailAnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse
)
from ....services.classifier import classifier_service
from ....config import settings

router = APIRouter()

@router.post(
    "/analyze",
    response_model=EmailAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Single Email",
    description="Inspects email subject, sender, and content using TF-IDF and calibrated Scikit-learn inference with evidence-based indicators."
)
async def analyze_email(payload: EmailAnalyzeRequest) -> EmailAnalyzeResponse:
    if not classifier_service.is_trained:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not yet trained or loaded. Run 'python -m backend.app.ml.train' to generate model artifacts."
        )

    try:
        result = classifier_service.analyze(
            subject=payload.subject,
            body=payload.body,
            sender=payload.sender,
            headers=payload.headers,
            redact_sensitive=payload.redact_sensitive
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}"
        )

@router.post(
    "/analyze/batch",
    response_model=BatchAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch Email Analysis",
    description=f"Concurrently analyzes up to {settings.MAX_BATCH_SIZE} emails. Returns individual classifications and aggregate statistics."
)
async def analyze_emails_batch(payload: BatchAnalyzeRequest) -> BatchAnalyzeResponse:
    if not classifier_service.is_trained:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not yet trained or loaded."
        )

    if len(payload.emails) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch size exceeds maximum limit of {settings.MAX_BATCH_SIZE} emails."
        )

    results = []
    for email_item in payload.emails:
        res = classifier_service.analyze(
            subject=email_item.subject,
            body=email_item.body,
            sender=email_item.sender,
            headers=email_item.headers,
            redact_sensitive=email_item.redact_sensitive
        )
        results.append(res)

    return BatchAnalyzeResponse(
        total_submitted=len(payload.emails),
        total_analyzed=len(results),
        results=results
    )

