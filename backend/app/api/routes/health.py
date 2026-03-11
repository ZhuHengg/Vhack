"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Returns API health status."""
    return {"status": "healthy", "service": "fraud-shield-api"}
