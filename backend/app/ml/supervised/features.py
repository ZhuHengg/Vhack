"""
==========================================
SUPERVISED FEATURES — Member A's workspace
==========================================
Feature engineering for the LightGBM model.

TODO (Member A):
    - Define feature extraction logic here
    - This keeps feature logic separate from model logic
"""

import numpy as np
from app.api.schemas.transaction import TransactionRequest


def extract_supervised_features(transaction: TransactionRequest) -> np.ndarray:
    """
    Extract features for the supervised model from a transaction.

    Args:
        transaction: Incoming transaction data

    Returns:
        1D numpy array of engineered features
    """
    # TODO: Implement real feature engineering
    # Example features:
    features = [
        transaction.amount,
        transaction.sender_balance_before or 0.0,
        transaction.sender_balance_after or 0.0,
        transaction.receiver_balance_before or 0.0,
        transaction.receiver_balance_after or 0.0,
        # Add more engineered features:
        # - amount / sender_balance ratio
        # - time-based features (hour of day, day of week)
        # - transaction type encoding
    ]

    return np.array(features).reshape(1, -1)
