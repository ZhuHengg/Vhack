"""
=============================================
UNSUPERVISED MODEL — Member B's workspace
=============================================
PyOD Isolation Forest for anomaly detection.
Detects UNKNOWN / behavioral anomalies without labels.

TODO (Member B):
    1. Implement feature engineering in features.py
    2. Complete the train() and predict() methods below
    3. Train the model using train.py
    4. Save the trained model to models/unsupervised/
"""

import numpy as np
import joblib
from app.ml.interface import BaseFraudModel


class UnsupervisedModel(BaseFraudModel):
    """PyOD Isolation Forest anomaly detector."""

    def __init__(self):
        self.model = None

    def load(self, model_path: str) -> None:
        """Load trained Isolation Forest model from disk."""
        self.model = joblib.load(model_path)
        print(f"✅ Unsupervised model loaded from {model_path}")

    def predict(self, features: np.ndarray) -> np.ndarray:
        """
        Predict anomaly score for each transaction.

        Args:
            features: 2D array (n_samples, n_features)

        Returns:
            1D array of anomaly scores (0.0 to 1.0)
            Higher = more anomalous
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        # TODO: Replace with actual prediction
        # raw_scores = self.model.decision_function(features)
        # Normalize to 0-1 range
        # normalized = (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-8)
        # return normalized

        # Placeholder: returns random scores
        return np.random.rand(features.shape[0])

    def train(self, X: np.ndarray, y: np.ndarray = None) -> None:
        """
        Train the Isolation Forest model (unsupervised — y is ignored).

        Args:
            X: Feature matrix
            y: Ignored (unsupervised learning)
        """
        # TODO: Implement training logic
        # from pyod.models.iforest import IForest
        # self.model = IForest(contamination=0.05, random_state=42)
        # self.model.fit(X)
        pass
