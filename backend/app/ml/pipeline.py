"""
End-to-end inference pipeline.
Loads all models and provides a single predict() interface.
"""

from app.config import get_settings
from app.ml.supervised.model import SupervisedModel
from app.ml.unsupervised.model import UnsupervisedModel
from app.ml.ensemble.meta_learner import MetaLearner
from app.ml.ensemble.stacker import Stacker
from app.api.schemas.transaction import TransactionRequest

settings = get_settings()


class FraudPipeline:
    """
    Loads all models and exposes a single predict() method.
    Used by the API service layer.
    """

    def __init__(self):
        self.supervised = SupervisedModel()
        self.unsupervised = UnsupervisedModel()
        self.meta_learner = MetaLearner()
        self.stacker: Stacker | None = None

    def load(self):
        """Load all models from disk."""
        self.supervised.load(settings.SUPERVISED_MODEL_PATH)
        self.unsupervised.load(settings.UNSUPERVISED_MODEL_PATH)
        self.meta_learner.load(settings.META_LEARNER_MODEL_PATH)

        self.stacker = Stacker(
            supervised_model=self.supervised,
            unsupervised_model=self.unsupervised,
            meta_learner=self.meta_learner,
        )
        print("✅ Full fraud detection pipeline loaded.")

    def predict(self, transaction: TransactionRequest) -> dict:
        """Run the full prediction pipeline."""
        if self.stacker is None:
            raise RuntimeError("Pipeline not loaded. Call load() first.")
        return self.stacker.predict(transaction)
