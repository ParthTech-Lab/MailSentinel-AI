from fastapi import APIRouter
from .endpoints import analyze, model_info

api_router = APIRouter()
api_router.include_router(analyze.router, tags=["Classification & Analysis"])
api_router.include_router(model_info.router, tags=["Model Governance & Metrics"])

