import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

def preprocess_features(df: pd.DataFrame):
    """
    Applies feature engineering, filters transaction types, and scales the features.
    
    Returns:
        X_scaled (np.ndarray): The scaled feature matrix ready for Isolation Forest.
        df_filtered (pd.DataFrame): The filtered dataframe for risk tier mapping.
        y_true (np.ndarray): The ground truth label array.
        fraud_rate (float): The actual fraud rate in the filtered dataset.
    """
    print("=" * 60)
    print("STEP 2: FEATURE ENGINEERING")
    print("=" * 60)

    # Phase B - Extract isMerchant_Dest
    df["isMerchant_Dest"] = df["nameDest"].str.startswith("M").astype(int)

    # Phase C - Filter to TRANSFER and CASH_OUT (fraud only occurs here)
    df_filtered = df[df["type"].isin(["TRANSFER", "CASH_OUT"])].copy()
    print(f"Rows after filtering to TRANSFER & CASH_OUT: {len(df_filtered)}")
    print(f"Fraud cases in filtered set: {df_filtered['isFraud'].sum()}")

    fraud_rate = df_filtered["isFraud"].mean()
    print(f"Fraud rate (filtered): {fraud_rate*100:.4f}%\n")

    # Phase D - Core Fraud Signature Features
    # exact_drain_suspicious
    # conditions to align simultaneously: sender transferred exact balance AND destination shows nothing received AND recipient is not a merchant.
    df_filtered["exact_drain_suspicious"] = (
        (df_filtered["amount"] == df_filtered["oldbalanceOrg"]) &
        (df_filtered["newbalanceDest"] == df_filtered["oldbalanceDest"]) &
        (df_filtered["isMerchant_Dest"] == 0)
    ).astype(int)

    # money_vanished
    # money left the sender's account but the destination balance shows nothing arrived.
    # amount above 100,000 and destination must not be a merchant
    df_filtered["money_vanished"] = (
        (df_filtered["newbalanceOrig"] < df_filtered["oldbalanceOrg"]) &
        (df_filtered["newbalanceDest"] == df_filtered["oldbalanceDest"]) &
        (df_filtered["amount"] > 100000) &
        (df_filtered["isMerchant_Dest"] == 0)
    ).astype(int)

    # transfer_and_vanished
    # Interaction feature combining TRANSFER type specifically with money_vanished.
    df_filtered["transfer_and_vanished"] = (
        (df_filtered["type"] == "TRANSFER") & 
        (df_filtered["money_vanished"] == 1)
    ).astype(int)

    # Phase E - Conditional Balance Discrepancy Features
    # raw balance discrepancies
    raw_disc_orig = (df_filtered["oldbalanceOrg"] - df_filtered["amount"]) - df_filtered["newbalanceOrig"]
    raw_disc_dest = (df_filtered["oldbalanceDest"] + df_filtered["amount"]) - df_filtered["newbalanceDest"]

    # discrepancy_orig_reliable
    # Only trust when sender transferred their exact account balance.
    df_filtered["discrepancy_orig_reliable"] = np.where(
        df_filtered["amount"] == df_filtered["oldbalanceOrg"], 
        raw_disc_orig, 
        0
    )

    # discrepancy_dest_reliable
    # Only trust when destination account was completely empty before transaction.
    df_filtered["discrepancy_dest_reliable"] = np.where(
        df_filtered["oldbalanceDest"] == 0, 
        raw_disc_dest, 
        0
    )

    # Phase F - Amount Context Feature (Bucket amount / oldbalanceOrg ratio)
    # sending less than 50% = 0, 50-90% = 1, 90-100% = 2, more than balance/extreme = 3.
    # use np.select or pd.cut
    ratio = df_filtered["amount"] / (df_filtered["oldbalanceOrg"] + 1)
    conditions = [
        ratio < 0.5,
        (ratio >= 0.5) & (ratio < 0.9),
        (ratio >= 0.9) & (ratio <= 1.0),
        ratio > 1.0
    ]
    choices = [0, 1, 2, 3]
    df_filtered["amount_risk_tier"] = np.select(conditions, choices, default=3)

    # Label-encode 'type'
    le = LabelEncoder()
    df_filtered["type"] = le.fit_transform(df_filtered["type"])
    print(f"Label encoding: {dict(zip(le.classes_, le.transform(le.classes_)))}")

    # Phase B (continued) - Drop Name Columns + Phase G (Drop rejected features)
    df_filtered.drop(columns=["nameOrig", "nameDest", "isFlaggedFraud"], inplace=True)

    # Separate target label and feature matrix
    y_true = df_filtered["isFraud"].values
    feature_cols = [c for c in df_filtered.columns if c != "isFraud" and c != "iso_risk_score" and c != "iso_prediction" and c != "risk_tier"]
    X = df_filtered[feature_cols].copy()
    print(f"\nFeatures ({len(feature_cols)}): {feature_cols}\n")

    print("=" * 60)
    print("STEP 3: STANDARD SCALING (Z-score normalisation)")
    print("=" * 60)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    sanity = pd.DataFrame({
        "feature": feature_cols,
        "mean":    np.mean(X_scaled, axis=0).round(6),
        "std":     np.std(X_scaled, axis=0).round(6),
    })
    print(sanity.to_string(index=False))
    print()

    return X_scaled, df_filtered, y_true, fraud_rate
