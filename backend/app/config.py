import json
from pathlib import Path
from typing import Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "MailSentinel AI Backend"
    APP_VERSION: str = "1.2.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    
    # Model storage paths
    MODEL_PATH: Path = BASE_DIR / "app" / "ml" / "artifacts" / "model.joblib"
    METRICS_PATH: Path = BASE_DIR / "app" / "ml" / "artifacts" / "metrics.json"
    DATASET_PATH: Path = BASE_DIR / "data" / "emails_dataset.csv"
    
    # Request limits
    MAX_BATCH_SIZE: int = 50
    MAX_EMAIL_BODY_CHARS: int = 50000
    MAX_REQUEST_BODY_BYTES: int = 1_048_576  # 1 MB limit
    
    # Security & Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # AI Uncertainty Guard Configurable Thresholds
    UNCERTAINTY_MIN_CONFIDENCE: float = 65.0
    UNCERTAINTY_MARGIN_THRESHOLD: float = 15.0
    UNCERTAINTY_MIN_WORD_COUNT: int = 6
    
    # Brand Impersonation Radar - Extensible monitored brands & known legitimate domains
    MONITORED_BRANDS: dict[str, list[str]] = {
        "paypal": ["paypal.com", "paypal-communication.com"],
        "microsoft": ["microsoft.com", "office.com", "outlook.com", "microsoft365.com", "live.com"],
        "google": ["google.com", "gmail.com", "googlemail.com", "google.co.uk"],
        "apple": ["apple.com", "icloud.com", "email.apple.com"],
        "amazon": ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr"],
        "netflix": ["netflix.com", "mailer.netflix.com"],
        "chase": ["chase.com", "jpmorganchase.com"],
        "wellsfargo": ["wellsfargo.com", "wellsfargobank.com"],
        "dhl": ["dhl.com", "dhl.de", "express.dhl"],
        "fedex": ["fedex.com", "delivery.fedex.com"],
        "docusign": ["docusign.com", "docusign.net"],
        "dropbox": ["dropbox.com", "dropboxmail.com"],
    }
    
    # Common free webmail domains often abused for brand spoofing
    FREE_WEBMAIL_DOMAINS: list[str] = [
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "mail.com", "aol.com", "proton.me", "protonmail.com"
    ]
    
    # CORS Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
