"""
Application configuration using Pydantic Settings.
Loads environment variables from .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "Fraud Shield API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Model paths
    SUPERVISED_MODEL_PATH: str = "models/supervised/lightgbm_v1.pkl"
    UNSUPERVISED_MODEL_PATH: str = "models/unsupervised/iforest_v1.pkl"
    META_LEARNER_MODEL_PATH: str = "models/ensemble/meta_learner_v1.pkl"

    # Risk thresholds
    HIGH_RISK_THRESHOLD: float = 70.0
    MEDIUM_RISK_THRESHOLD: float = 40.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
