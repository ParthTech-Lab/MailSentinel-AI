from fastapi import APIRouter, status
from ....schemas.model import ModelInfoResponse
from ....services.classifier import classifier_service

router = APIRouter()

@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Model Architecture & Benchmark Metrics",
    description="Retrieves the current status, version, training timestamp, and verified offline evaluation metrics."
)
async def get_model_information() -> ModelInfoResponse:
    return classifier_service.get_info()

