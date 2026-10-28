import time
import logging
from collections import defaultdict
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from ..config import settings

logger = logging.getLogger("mailsentinel.security")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects defensive HTTP security headers into all responses."""
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Enforces maximum payload size limits to protect against volumetric DoS."""
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length_int = int(content_length)
                if length_int > settings.MAX_REQUEST_BODY_BYTES:
                    logger.warning(f"Request body exceeded limit: {length_int} bytes from {request.client.host if request.client else 'unknown'}")
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request body too large. Maximum permitted size is {settings.MAX_REQUEST_BODY_BYTES // 1024} KB."
                        }
                    )
            except ValueError:
                pass
        return await call_next(request)

class InMemoryRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter per client IP address.
    Self-prunes historical timestamps to avoid unbounded memory growth.
    """
    def __init__(self, app, max_requests_per_minute: int = 60):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.window_seconds = 60
        self.request_records = defaultdict(list)
        self.last_cleanup = time.time()

    def _cleanup_stale(self, now: float):
        if now - self.last_cleanup > 120:
            threshold = now - self.window_seconds
            for ip in list(self.request_records.keys()):
                valid_timestamps = [t for t in self.request_records[ip] if t > threshold]
                if valid_timestamps:
                    self.request_records[ip] = valid_timestamps
                else:
                    del self.request_records[ip]
            self.last_cleanup = now

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Exempt health check and docs from strict rate limiting
        if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        self._cleanup_stale(now)

        window_start = now - self.window_seconds
        records = [t for t in self.request_records[client_ip] if t > window_start]
        self.request_records[client_ip] = records

        if len(records) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for IP {client_ip}: {len(records)} requests in window")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please wait before submitting additional analysis requests."
                },
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0"
                }
            )

        self.request_records[client_ip].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.max_requests - len(self.request_records[client_ip])))
        return response

