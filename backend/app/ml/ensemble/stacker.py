"""
==============================================
STACKER — Orchestrates L1 → L2 pipeline
==============================================
Coordinates the flow from raw features through both
L1 models and into the meta-learner.
"""

import numpy as np
from app.ml.supervised.model import SupervisedModel
from app.ml.supervised.features import extract_supervised_features
from app.ml.unsupervised.model import UnsupervisedModel
from app.ml.unsupervised.features import extract_unsupervised_features
from app.ml.ensemble.meta_learner import MetaLearner
from app.api.schemas.transaction import TransactionRequest


class Stacker:
    """
    Orchestrates the stacking ensemble:
    1. Extract features for each L1 model
    2. Get predictions from both L1 models
    3. Feed L1 outputs into the meta-learner
    4. Return final risk score (0-100)
    """

    def __init__(
        self,
        supervised_model: SupervisedModel,
        unsupervised_model: UnsupervisedModel,
        meta_learner: MetaLearner,
    ):
        self.supervised = supervised_model
        self.unsupervised = unsupervised_model
        self.meta_learner = meta_learner

    def predict(self, transaction: TransactionRequest) -> dict:
        """
        Run the full stacking pipeline on a single transaction.

        Returns:
            dict with supervised_score, unsupervised_score, and risk_score
        """
        # Layer 1: Extract features & get predictions
        sup_features = extract_supervised_features(transaction)
        unsup_features = extract_unsupervised_features(transaction)

        sup_score = self.supervised.predict(sup_features)
        unsup_score = self.unsupervised.predict(unsup_features)

        # Layer 2: Meta-learner combines L1 outputs
        risk_score = self.meta_learner.predict(sup_score, unsup_score)

        return {
            "supervised_score": float(sup_score[0]),
            "unsupervised_score": float(unsup_score[0]),
            "risk_score": float(risk_score[0]),
        }
