from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "CarpenterBullet WhatsApp CRM"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "carpenterbullet-whatsapp-crm-super-secret-key-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./whatsapp_crm.db"
    
    # WhatsApp Gateway Service URL
    WHATSAPP_GATEWAY_URL: str = os.getenv("WHATSAPP_GATEWAY_URL", "http://localhost:3001")
    
    # Campaign defaults
    DEFAULT_MIN_DELAY_SECONDS: int = 3
    DEFAULT_MAX_DELAY_SECONDS: int = 6
    DEFAULT_COUNTRY_CODE: str = "91"  # Default to India if 10-digit phone
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
