"""
Pydantic schema for risk score response.
"""

from pydantic import BaseModel, Field


class RiskResponse(BaseModel):
    """Response schema for fraud prediction."""

    transaction_id: str
    risk_score: float = Field(..., ge=0, le=100, description="Final risk score (0-100)")
    risk_level: str = Field(..., description="LOW / MEDIUM / HIGH")
    supervised_score: float = Field(..., description="LightGBM fraud probability")
    unsupervised_score: float = Field(..., description="Isolation Forest anomaly score")

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "TXN_001",
                "risk_score": 73.5,
                "risk_level": "HIGH",
                "supervised_score": 0.82,
                "unsupervised_score": 0.65,
            }
        }
