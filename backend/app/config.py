from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env or container environment."""

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

    environment: str = "local"
    database_url: str | None = None
    app_env: str = "development"

    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    auth_provider: str = "supabase"
    auth_mock_mode: bool = False
    backend_cors_origins: str | None = None

    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    openai_vision_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    whatsapp_provider: str = "mock"
    whatsapp_access_token: str | None = None
    whatsapp_phone_number_id: str | None = None

    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_whatsapp_from: str | None = None

    calcom_api_key: str | None = None
    calcom_api_base: str = "https://api.cal.com"
    calcom_api_version: str = "2024-08-13"
    calcom_event_type_id: str | None = None
    calcom_username: str | None = None
    calcom_event_type_slug: str = "property-viewing"
    calcom_timezone: str = "Asia/Kolkata"

    vapi_webhook_secret: str | None = None

    elevenlabs_api_key: str | None = None
    elevenlabs_agent_id: str | None = None
    elevenlabs_agent_phone_number_id: str | None = None
    elevenlabs_webhook_secret: str | None = None
    elevenlabs_mode: str = "mock"
    elevenlabs_max_calls_per_day: int = 10
    elevenlabs_max_call_seconds: int = 240
    elevenlabs_allowed_call_start_hour: int = 10
    elevenlabs_allowed_call_end_hour: int = 19
    elevenlabs_cooldown_hours: int = 24

    allowed_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")

    @property
    def cors_origins(self) -> List[str]:
        origins = self.backend_cors_origins or self.allowed_origins
        return [origin.strip() for origin in origins.split(",") if origin.strip()]

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
