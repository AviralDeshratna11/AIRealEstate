from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env or container environment."""

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

    environment: str = "local"
    database_url: str | None = None

    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    openai_vision_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    calcom_api_key: str | None = None
    calcom_api_base: str = "https://api.cal.com"
    calcom_api_version: str = "2024-08-13"
    calcom_event_type_id: str | None = None
    calcom_username: str | None = None
    calcom_event_type_slug: str = "property-viewing"
    calcom_timezone: str = "Asia/Kolkata"

    vapi_webhook_secret: str | None = None
    allowed_origins: str = Field(default="http://localhost:3000")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
