"""
=============================================
UNSUPERVISED TRAINING — Member B's workspace
=============================================
Training script for the Isolation Forest model.

Usage:
    python -m app.ml.unsupervised.train

TODO (Member B):
    1. Load your training dataset
    2. Run feature engineering
    3. Train the Isolation Forest model
    4. Save the model to models/unsupervised/
"""

import joblib
import numpy as np
from pathlib import Path

# from app.ml.unsupervised.model import UnsupervisedModel


def train_unsupervised_model():
    """Train and save the unsupervised model."""

    # TODO: Load training data (no labels needed)
    # import pandas as pd
    # df = pd.read_csv("data/processed/train.csv")
    # X = df.drop("is_fraud", axis=1).values  # labels not needed

    # TODO: Train model
    # model = UnsupervisedModel()
    # model.train(X)

    # TODO: Save model
    # output_path = Path("models/unsupervised/iforest_v1.pkl")
    # output_path.parent.mkdir(parents=True, exist_ok=True)
    # joblib.dump(model.model, str(output_path))
    # print(f"✅ Unsupervised model saved to {output_path}")

    print("⚠️  Training not implemented yet. Complete the TODOs!")


if __name__ == "__main__":
    train_unsupervised_model()
