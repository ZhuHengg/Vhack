"""
Shared preprocessing utilities.
Common data transformations used by both supervised and unsupervised models.
"""

import numpy as np
from typing import Dict, Any


def encode_transaction_type(transaction_type: str) -> int:
    """
    Encode transaction type to numeric.

    Args:
        transaction_type: String type (e.g. 'transfer', 'cash_out')

    Returns:
        Integer encoding
    """
    type_mapping = {
        "transfer": 0,
        "cash_out": 1,
        "payment": 2,
        "debit": 3,
        "cash_in": 4,
    }
    return type_mapping.get(transaction_type.lower(), -1)


def compute_balance_delta(balance_before: float, balance_after: float) -> float:
    """Compute the change in balance."""
    return balance_after - balance_before


def normalize_amount(amount: float, max_amount: float = 100000.0) -> float:
    """Min-max normalize a transaction amount."""
    return min(amount / max_amount, 1.0)
