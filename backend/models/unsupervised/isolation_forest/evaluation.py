import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import os

def evaluate_predictions(y_true: np.ndarray, iso_predictions: np.ndarray, df_filtered: pd.DataFrame, out_plots: str, out_results: str) -> pd.DataFrame:
    """
    Evaluates the model by generating classification reports, a confusion matrix heatmap, 
    risk score distributions, and saving top 10 anomalies.
    """
    print("=" * 60)
    print("STEP 6: EVALUATION")
    print("=" * 60)

    # 1. Classification report
    report_text = classification_report(
        y_true, iso_predictions,
        target_names=["Legitimate", "Fraud"],
    )
    print(report_text)
    
    # Save Report
    report_path = os.path.join(out_results, "classification_report.txt")
    with open(report_path, "w") as f:
        f.write(report_text)
    print(f"Saved: {report_path}")

    # 2. Confusion matrix heatmap
    cm = confusion_matrix(y_true, iso_predictions)
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=["Legitimate", "Fraud"],
        yticklabels=["Legitimate", "Fraud"],
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Isolation Forest — Confusion Matrix")
    plt.tight_layout()
    cm_plot_path = os.path.join(out_plots, "confusion_matrix.png")
    fig.savefig(cm_plot_path, dpi=150)
    plt.close(fig)
    print(f"Saved: {cm_plot_path}")

    # 3. Risk score distribution
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(
        df_filtered.loc[df_filtered["isFraud"] == 0, "iso_risk_score"],
        bins=80, alpha=0.6, label="Legitimate", color="#2196F3",
    )
    ax.hist(
        df_filtered.loc[df_filtered["isFraud"] == 1, "iso_risk_score"],
        bins=80, alpha=0.7, label="Fraud", color="#F44336",
    )
    ax.axvline(70, color="orange", ls="--", lw=1.2, label="Approve / Flag boundary (70)")
    ax.axvline(92, color="red",    ls="--", lw=1.2, label="Flag / Block boundary (92)")
    ax.set_xlabel("Risk Score (0–100)")
    ax.set_ylabel("Transaction Count")
    ax.set_title("Risk Score Distribution by Class")
    ax.legend()
    plt.tight_layout()
    dist_plot_path = os.path.join(out_plots, "risk_score_distribution.png")
    fig.savefig(dist_plot_path, dpi=150)
    plt.close(fig)
    print(f"Saved: {dist_plot_path}")

    # 4. Feature Correlation Heatmap
    # We use df_filtered but only numeric columns used as features + isFraud
    feature_cols = [c for c in df_filtered.columns if c not in ("iso_risk_score", "iso_prediction", "risk_tier", "nameOrig", "nameDest", "isFlaggedFraud", "type")] 
    # Notice we exclude strings if any are left
    
    corr_df = df_filtered[feature_cols].copy()
    # ensuring type is numeric if we want to include it (it was label encoded)
    if 'type' in df_filtered.columns and pd.api.types.is_numeric_dtype(df_filtered['type']):
        corr_df['type'] = df_filtered['type']
        
    corr = corr_df.corr()
    
    fig, ax = plt.subplots(figsize=(14, 12))
    mask = np.triu(np.ones_like(corr, dtype=bool))
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    sns.heatmap(corr, mask=mask, cmap=cmap, vmax=1.0, vmin=-1.0, center=0,
                square=True, linewidths=.5, annot=True, fmt=".2f", cbar_kws={"shrink": .5}, ax=ax)
    
    ax.set_title("Feature Correlation Heatmap", fontsize=16)
    plt.tight_layout()
    corr_plot_path = os.path.join(out_plots, "correlation_heatmap.png")
    fig.savefig(corr_plot_path, dpi=200)
    plt.close(fig)
    print(f"Saved: {corr_plot_path}")
    ax.axvline(92, color="red",    ls="--", lw=1.2, label="Flag / Block boundary (92)")
    ax.set_xlabel("Risk Score (0–100)")
    ax.set_ylabel("Transaction Count")
    ax.set_title("Risk Score Distribution by Class")
    ax.legend()
    plt.tight_layout()
    dist_plot_path = os.path.join(out_plots, "risk_score_distribution.png")
    fig.savefig(dist_plot_path, dpi=150)
    plt.close(fig)
    print(f"Saved: {dist_plot_path}")

    # 4. Top 10 most anomalous transactions
    top10 = df_filtered.nlargest(10, "iso_risk_score")
    print("\nTop 10 Most Anomalous Transactions:")
    print(top10.to_string(index=False))

    top10_path = os.path.join(out_results, "top10_anomalies.csv")
    top10.to_csv(top10_path, index=False)
    print(f"Saved: {top10_path}")

    # 5. Save all predicted fraud transactions
    predicted_frauds = df_filtered[df_filtered["iso_prediction"] == 1]
    predicted_frauds_path = os.path.join(out_results, "predicted_frauds.csv")
    predicted_frauds.to_csv(predicted_frauds_path, index=False)
    print(f"Saved: {predicted_frauds_path} (Total Predicted Frauds: {len(predicted_frauds)})")

    return top10
