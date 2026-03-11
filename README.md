# Vhack - Real-Time Fraud Shield for the Unbanked

A production-ready FastAPI backend powering a **Stacking Ensemble Machine Learning Architecture** for real-time fraud detection.

## 🏗️ Architecture

This backend implements a Layer 1 to Layer 2 stacking pipeline:

- **Layer 1 - Supervised Model:** LightGBM (Member A) targeting *known* fraud patterns from labeled data.
- **Layer 1 - Unsupervised Model:** PyOD Isolation Forest (Member B) targeting *behavioral anomalies* without labels.
- **Layer 2 - Meta-Learner:** Logistic Regression combining L1 scores into a final 0-100 risk score.

## 📂 Folder Structure & Roles

We have designed the repository for **zero merge conflicts**. Each ML engineer works in their own dedicated directory.

```text
backend/
├── app/
│   ├── api/          # API Routes (FastAPI POST /predict)
│   ├── ml/           # 🧠 ML Pipeline (Core)
│   │   ├── interface.py       # Contract both L1 models MUST follow!
│   │   ├── supervised/        # 👤 Member A works here (LightGBM)
│   │   ├── unsupervised/      # 👤 Member B works here (Isolation Forest)
│   │   └── ensemble/          # 🔗 Combines L1 models (Meta-Learner)
│   └── services/     # Business logic & risk classification
```

## 🚀 Getting Started

### 1. Setup Environment
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

### 2. Team Member Workflow

**Member A (Supervised - LightGBM)**
1. Work exclusively inside `backend/app/ml/supervised/`
2. Define feature extraction in `features.py`
3. Implement `SupervisedModel` in `model.py` (Must match `interface.py`)
4. Write training logic in `train.py`
5. Save generated model to `backend/models/supervised/`

**Member B (Unsupervised - Isolation Forest)**
1. Work exclusively inside `backend/app/ml/unsupervised/`
2. Define behavioral feature extraction in `features.py`
3. Implement `UnsupervisedModel` in `model.py` (Must match `interface.py`)
4. Write training logic in `train.py`
5. Save generated model to `backend/models/unsupervised/`

### 3. Compiling the Ensemble (Layer 2)
Once both Layer 1 models are saved:
1. Extract predictions for the validation set using both models.
2. Update and run `backend/app/ml/ensemble/train.py` to train the Logistic Regression Meta-Learner.
3. Save the meta-learner to `backend/models/ensemble/`.

### 4. Running the API
From the `backend/` directory:
```bash
uvicorn app.main:app --reload
```
View the interactive API documentation at: http://localhost:8000/docs