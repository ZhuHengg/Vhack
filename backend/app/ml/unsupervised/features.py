"""
=============================================
UNSUPERVISED FEATURES — Member B's workspace
=============================================
Feature engineering for the Isolation Forest model.

TODO (Member B):
    - Define feature extraction logic here
    - May differ from supervised features (e.g. behavioral patterns)
"""

import numpy as np
from app.api.schemas.transaction import TransactionRequest


def extract_unsupervised_features(transaction: TransactionRequest) -> np.ndarray:
    """
    Extract features for the unsupervised model from a transaction.

    Args:
        transaction: Incoming transaction data

    Returns:
        1D numpy array of engineered features
    """
    # TODO: Implement real feature engineering
    # Anomaly detection may benefit from different features:
    features = [
        transaction.amount,
        transaction.sender_balance_before or 0.0,
        transaction.sender_balance_after or 0.0,
        transaction.receiver_balance_before or 0.0,
        transaction.receiver_balance_after or 0.0,
        # Add more features focused on behavioral patterns:
        # - velocity features (transactions per hour)
        # - deviation from user's average amount
        # - new recipient flag
    ]

    return np.array(features).reshape(1, -1)
