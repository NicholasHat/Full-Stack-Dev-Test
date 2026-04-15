from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="HVAC Estimator Demo API", alias="APP_NAME")
    env: str = Field(default="development", alias="ENV")
    markup_multiplier: float = Field(default=1.0, alias="MARKUP_MULTIPLIER")
    cors_origins_raw: str = Field(
        default="http://localhost:8081,http://localhost:19006,exp://127.0.0.1:19000",
        alias="CORS_ORIGINS",
    )

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")

    @property
    def repo_root(self) -> Path:
        return Path(__file__).resolve().parents[3]

    @property
    def data_dir(self) -> Path:
        return self.repo_root / "data"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


settings = Settings()
