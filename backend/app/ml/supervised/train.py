"""
==========================================
SUPERVISED TRAINING — Member A's workspace
==========================================
Training script for the LightGBM model.

Usage:
    python -m app.ml.supervised.train

TODO (Member A):
    1. Load your training dataset
    2. Run feature engineering
    3. Train the LightGBM model
    4. Save the model to models/supervised/
"""

import joblib
import numpy as np
from pathlib import Path

# from app.ml.supervised.model import SupervisedModel


def train_supervised_model():
    """Train and save the supervised model."""

    # TODO: Load training data
    # import pandas as pd
    # df = pd.read_csv("data/processed/train.csv")
    # X = df.drop("is_fraud", axis=1).values
    # y = df["is_fraud"].values

    # TODO: Train model
    # model = SupervisedModel()
    # model.train(X, y)

    # TODO: Save model
    # output_path = Path("models/supervised/lightgbm_v1.pkl")
    # output_path.parent.mkdir(parents=True, exist_ok=True)
    # joblib.dump(model.model, str(output_path))
    # print(f"✅ Supervised model saved to {output_path}")

    print("⚠️  Training not implemented yet. Complete the TODOs!")


if __name__ == "__main__":
    train_supervised_model()
