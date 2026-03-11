"""
Fraud Shield API - Main Application Entry Point
Real-Time Fraud Detection for the Unbanked
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import predict, health

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-Time Fraud Shield for the Unbanked - Stacking Ensemble ML API",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, prefix="/api/v1", tags=["Prediction"])


@app.on_event("startup")
async def startup_event():
    """Load ML models into memory on startup."""
    from app.api.dependencies import load_models
    load_models()
