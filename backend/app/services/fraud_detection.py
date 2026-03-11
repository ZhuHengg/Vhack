"""
Fraud Detection Service — Business logic layer.
Orchestrates the ML pipeline and applies business rules.
"""

from app.ml.pipeline import FraudPipeline
from app.api.schemas.transaction import TransactionRequest
from app.api.schemas.risk import RiskResponse
from app.config import get_settings

settings = get_settings()


class FraudDetectionService:
    """
    Service that wraps the ML pipeline with business logic.
    Converts raw ML output into actionable API responses.
    """

    def __init__(self):
        self.pipeline = FraudPipeline()

    def evaluate(self, transaction: TransactionRequest) -> RiskResponse:
        """
        Evaluate a transaction for fraud risk.

        Args:
            transaction: Incoming transaction data

        Returns:
            RiskResponse with scores and risk level
        """
        # Run ML pipeline
        result = self.pipeline.predict(transaction)

        # Classify risk level based on thresholds
        risk_score = result["risk_score"]
        if risk_score >= settings.HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
        elif risk_score >= settings.MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return RiskResponse(
            transaction_id=transaction.transaction_id,
            risk_score=round(risk_score, 2),
            risk_level=risk_level,
            supervised_score=round(result["supervised_score"], 4),
            unsupervised_score=round(result["unsupervised_score"], 4),
        )
