"""
Prediction endpoint - Main fraud scoring route.
Receives a transaction and returns a risk score (0-100).
"""

from fastapi import APIRouter, Depends

from app.api.schemas.transaction import TransactionRequest
from app.api.schemas.risk import RiskResponse
from app.services.fraud_detection import FraudDetectionService

router = APIRouter()


@router.post("/predict", response_model=RiskResponse)
async def predict_fraud(transaction: TransactionRequest):
    """
    Predict fraud risk for a given transaction.
    Returns a risk score from 0 (safe) to 100 (fraudulent).
    """
    service = FraudDetectionService()
    result = service.evaluate(transaction)
    return result
