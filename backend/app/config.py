import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HI IN Property Directory"
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "hi_in_super_secret_jwt_key_development_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database URL: defaults to sqlite for local zero-dependency run, can be overridden by POSTGRES_URL or DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hi_in.db")
    
    # Environment flag for developer demonstration mode
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Upload folder
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    # Phase 3: Evidence-Based AI Property Intelligence Engine
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai_compatible")
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "current-model")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "120.0"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "3500"))
    AI_PROMPT_VERSION: str = "v3.0.0-buyer-analyst"

    ROOT_ENV_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
    BACKEND_ENV_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

    model_config = SettingsConfigDict(
        env_file=[
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        ],
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "photos"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "documents"), exist_ok=True)
