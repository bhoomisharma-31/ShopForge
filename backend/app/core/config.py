"""
ShopForge — Application Configuration

Centralised settings powered by pydantic-settings.  Values are loaded
automatically from environment variables and / or a `.env` file located
in the backend root directory.

Usage:
    from app.core.config import settings

    print(settings.MONGODB_URL)
"""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, MongoDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve the path to the `.env` file relative to *this* file.
# Layout: backend/app/core/config.py  →  backend/.env
_ENV_FILE: Path = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """
    Immutable, validated application settings.

    Every field maps 1-to-1 to an environment variable of the same name
    (case-insensitive).  Defaults are provided where it is safe to do so;
    secrets intentionally have **no** default so the app fails fast when
    they are missing.
    """

    # -- General --------------------------------------------------------------
    APP_NAME: str = "ShopForge"
    APP_ENV: str = Field(default="development", pattern=r"^(development|staging|production)$")
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = Field(default=["http://localhost:5173"])

    # -- MongoDB --------------------------------------------------------------
    MONGODB_URL: MongoDsn = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string (SRV or standard).",
    )
    DATABASE_NAME: str = Field(
        default="shopforge",
        min_length=1,
        max_length=64,
        description="Name of the MongoDB database.",
    )

    # -- JWT Authentication ---------------------------------------------------
    JWT_SECRET_KEY: str = Field(
        ...,                              # required — no default
        min_length=32,
        description="Secret key used to sign JWT tokens.  "
                    "Generate with: python -c \"import secrets; print(secrets.token_urlsafe(64))\"",
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        pattern=r"^(HS256|HS384|HS512)$",
        description="HMAC algorithm for JWT signing.",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        gt=0,
        le=1440,                          # max 24 h
        description="Lifetime of an access token in minutes.",
    )

    # -- Stripe ---------------------------------------------------------------
    STRIPE_SECRET_KEY: str = Field(
        ...,                              # required — no default
        description="Stripe secret API key (sk_test_… / sk_live_…).",
    )
    STRIPE_WEBHOOK_SECRET: str = Field(
        ...,                              # required — no default
        description="Stripe webhook signing secret (whsec_…).",
    )

    # -- Pydantic-settings configuration --------------------------------------
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",                   # silently drop unknown env vars
    )

    # -- Validators -----------------------------------------------------------
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        """Accept a JSON list string **or** a plain Python list."""
        if isinstance(v, str):
            import json

            try:
                parsed = json.loads(v)
            except json.JSONDecodeError:
                # Treat as a single-origin comma-separated string.
                parsed = [origin.strip() for origin in v.split(",") if origin.strip()]
            return parsed
        return v

    # -- Computed helpers (not env-backed) ------------------------------------
    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def mongodb_url_str(self) -> str:
        """Return the MongoDB URL as a plain string (Motor expects str)."""
        return str(self.MONGODB_URL)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached singleton of :class:`Settings`.

    Using ``lru_cache`` guarantees the ``.env`` file is read only once
    and the same validated object is reused everywhere.
    """
    return Settings()  # type: ignore[call-arg]


# Convenience alias so the rest of the codebase can simply do:
#     from app.core.config import settings
settings: Settings = get_settings()
