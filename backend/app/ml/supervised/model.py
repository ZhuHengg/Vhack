"""
==========================================
SUPERVISED MODEL — Member A's workspace
==========================================
LightGBM-based fraud detection model.
Detects KNOWN fraud patterns from labeled data.

TODO (Member A):
    1. Implement feature engineering in features.py
    2. Complete the train() and predict() methods below
    3. Train the model using train.py
    4. Save the trained model to models/supervised/
"""

import numpy as np
import joblib
from app.ml.interface import BaseFraudModel


class SupervisedModel(BaseFraudModel):
    """LightGBM fraud classifier."""

    def __init__(self):
        self.model = None

    def load(self, model_path: str) -> None:
        """Load trained LightGBM model from disk."""
        self.model = joblib.load(model_path)
        print(f"✅ Supervised model loaded from {model_path}")

    def predict(self, features: np.ndarray) -> np.ndarray:
        """
        Predict fraud probability for each transaction.

        Args:
            features: 2D array (n_samples, n_features)

        Returns:
            1D array of fraud probabilities (0.0 to 1.0)
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        # TODO: Replace with actual prediction
        # probabilities = self.model.predict_proba(features)[:, 1]
        # return probabilities

        # Placeholder: returns random scores
        return np.random.rand(features.shape[0])

    def train(self, X: np.ndarray, y: np.ndarray = None) -> None:
        """
        Train the LightGBM model.

        Args:
            X: Feature matrix
            y: Binary labels (0 = legit, 1 = fraud)
        """
        # TODO: Implement training logic
        # import lightgbm as lgb
        # self.model = lgb.LGBMClassifier(...)
        # self.model.fit(X, y)
        pass
