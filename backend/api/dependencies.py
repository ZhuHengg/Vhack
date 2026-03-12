"""
Shared dependencies for the API.
Handles model loading and provides model instances to routes.
"""

from app.ml.pipeline import FraudPipeline

# Global pipeline instance
_pipeline: FraudPipeline | None = None


def load_models():
    """Load all ML models into memory. Called on app startup."""
    global _pipeline
    _pipeline = FraudPipeline()
    _pipeline.load()
    print("✅ All ML models loaded successfully.")


def get_pipeline() -> FraudPipeline:
    """Dependency to get the loaded ML pipeline."""
    if _pipeline is None:
        raise RuntimeError("ML pipeline not loaded. Call load_models() first.")
    return _pipeline
