"""
Pydantic schema for incoming transaction data.
Adjust fields to match your actual dataset features.
"""

from pydantic import BaseModel, Field
from typing import Optional


class TransactionRequest(BaseModel):
    """Schema for a transaction to be scored."""

    transaction_id: str = Field(..., description="Unique transaction identifier")
    amount: float = Field(..., description="Transaction amount")
    sender_id: str = Field(..., description="Sender account/wallet ID")
    receiver_id: str = Field(..., description="Receiver account/wallet ID")
    transaction_type: str = Field(..., description="e.g. 'transfer', 'cash_out', 'payment'")
    timestamp: str = Field(..., description="Transaction timestamp (ISO 8601)")

    # Optional features — extend as needed
    sender_balance_before: Optional[float] = None
    sender_balance_after: Optional[float] = None
    receiver_balance_before: Optional[float] = None
    receiver_balance_after: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "TXN_001",
                "amount": 5000.00,
                "sender_id": "USER_A",
                "receiver_id": "USER_B",
                "transaction_type": "transfer",
                "timestamp": "2026-03-11T16:00:00Z",
                "sender_balance_before": 10000.00,
                "sender_balance_after": 5000.00,
                "receiver_balance_before": 2000.00,
                "receiver_balance_after": 7000.00,
            }
        }
