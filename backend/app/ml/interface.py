"""
Base interface (contract) for all Level-1 models.
Both supervised and unsupervised models MUST implement this interface.

This ensures the meta-learner can consume outputs from both models
without caring about internal implementation details.
"""

from abc import ABC, abstractmethod
import numpy as np


class BaseFraudModel(ABC):
    """
    Contract that both L1 models must follow.

    Member A (Supervised) and Member B (Unsupervised) should each
    create a class that inherits from this base class and implements
    all abstract methods.
    """

    @abstractmethod
    def load(self, model_path: str) -> None:
        """Load a trained model from disk."""
        ...

    @abstractmethod
    def predict(self, features: np.ndarray) -> np.ndarray:
        """
        Return a score/probability for each sample.

        Args:
            features: 2D numpy array of shape (n_samples, n_features)

        Returns:
            1D numpy array of scores, one per sample.
            - Supervised: fraud probability (0.0 to 1.0)
            - Unsupervised: anomaly score (0.0 to 1.0)
        """
        ...

    @abstractmethod
    def train(self, X: np.ndarray, y: np.ndarray = None) -> None:
        """
        Train the model.

        Args:
            X: Feature matrix
            y: Labels (used by supervised, ignored by unsupervised)
        """
        ...
