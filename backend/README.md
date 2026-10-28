# MailSentinel AI — Backend API & Machine Learning Engine

A high-performance Python FastAPI service and Scikit-learn email classification pipeline for detecting Safe, Spam, and Phishing emails with evidence-based explainability.

---

## 1. Prerequisites
- **Python 3.11+** installed on Windows.
- PowerShell or Command Prompt.

---

## 2. Setup Instructions (Windows)

### Step 1: Create and Activate Virtual Environment
```powershell
# From the project root directory
python -m venv backend/venv

# Activate in PowerShell
.\backend\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

### Step 2: Install Backend Dependencies
```powershell
.\backend\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
```

### Step 3: Train the Machine Learning Pipeline
Trains a genuine TF-IDF + Logistic Regression pipeline on documented benchmark datasets and evaluates on a held-out test partition:
```powershell
$env:PYTHONIOENCODING="utf-8"
.\backend\venv\Scripts\python.exe -m backend.app.ml.train
```
*Outputs `backend/app/ml/artifacts/model.joblib` and `backend/app/ml/artifacts/metrics.json`.*

### Step 4: Run Automated Tests
```powershell
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v
```

### Step 5: Start the FastAPI Server
```powershell
.\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation will be available at:
- Swagger UI: **http://127.0.0.1:8000/docs**
- ReDoc: **http://127.0.0.1:8000/redoc**

---

## 3. Endpoints Specification

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | System health and model readiness |
| `GET` | `/api/v1/model-info` | Algorithm architecture, dataset counts, and verified offline metrics |
| `POST` | `/api/v1/analyze` | Single email analysis (Subject, Body, Sender, Headers) |
| `POST` | `/api/v1/analyze/batch` | Concurrently analyze up to 50 emails |

---

## 4. Machine Learning & Explainability

### Pipeline Architecture
1. **Feature Extraction**: `TfidfVectorizer(ngram_range=(1, 2), max_features=4000, sublinear_tf=True)`
2. **Classifier**: `LogisticRegression(C=1.5, class_weight="balanced", max_iter=1000)`
3. **Calibrated Probabilities**: Produces probability distribution over `Safe`, `Spam`, and `Phishing`.

### Explainability Heuristics
- **Urgency / Threat Coercion**: Detects countdown deadlines, account suspension threats, and punitive warnings.
- **Credential & Financial Harvesting**: Identifies requests for passwords, PINs, OTP codes, credit cards, or banking information.
- **Suspicious Links**: Flags numerical IP addresses in URLs, typosquatting domains (e.g. `paypa1`, `0` instead of `o`), and unencrypted HTTP destinations.
- **Spam Language**: Detects sweepstakes prize notices, unsolicited promotions, and commercial marketing patterns.
- **Sender Discrepancies**: Highlights mismatches between referenced brands and originating sender domains.
- **Transparency**: Every indicator carries `is_externally_verified=False` with clear advisories that textual heuristics are evaluated locally without DNS/DKIM external lookups.

