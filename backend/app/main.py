import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .api.v1.router import api_router
from .services.classifier import classifier_service
from .middleware.security import (
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware,
    InMemoryRateLimiterMiddleware
)

# Configure defensive application logging (records metadata only, never raw email content)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mailsentinel.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} (Env: {settings.ENVIRONMENT})")
    classifier_service.load_model()
    if classifier_service.is_trained:
        logger.info(f"Scikit-learn model successfully loaded from {settings.MODEL_PATH}")
    else:
        logger.warning(f"Model not found at {settings.MODEL_PATH}. Run 'python -m backend.app.ml.train' to build.")
    yield
    logger.info("Shutting down MailSentinel AI backend.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "MailSentinel AI — Real-time AI-powered Fake, Spam, and Phishing Email Detection API. "
        "Provides TF-IDF + Scikit-learn inference with evidence-based indicator extraction, "
        "AI uncertainty guarding, brand impersonation radar, and safe link inspection."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Defensive Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# 2. Maximum Payload Size Protection (1MB)
app.add_middleware(RequestSizeLimitMiddleware)

# 3. Sliding-window Rate Limiter (60 req/min/IP)
app.add_middleware(InMemoryRateLimiterMiddleware, max_requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

# 4. CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"]
)

# Global Safe Exception Handler (prevents stack trace leaks in production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred while processing your request. Please check inputs and retry."
        }
    )

# Include v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["System Health"],
    summary="Health & Readiness Check",
    description="Returns backend uptime status, runtime environment, and ML model operational readiness."
)
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "model_status": "trained" if classifier_service.is_trained else "uninitialized",
        "model_ready": classifier_service.is_trained,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
