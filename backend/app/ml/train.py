import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ..config import settings
from .dataset import get_train_test_data, load_dataset, DOCUMENTED_BENCHMARK_SOURCES
from .evaluate import evaluate_pipeline

def train_and_save_model() -> dict:
    """
    Trains a genuine scikit-learn text classification pipeline on documented email benchmark data.
    Saves the pipeline artifact via joblib and evaluation metrics to JSON.
    """
    print("=" * 60)
    print("MailSentinel AI -- Training Email Threat Classifier")
    print("=" * 60)

    # 1. Load data
    df = load_dataset()
    print(f"Loaded {len(df)} total samples from dataset")
    counts = df["label"].value_counts().to_dict()
    print(f"Class distribution: {counts}")

    X_train, X_test, y_train, y_test = get_train_test_data(test_size=0.25, random_state=42)
    print(f"Training partition: {len(X_train)} samples | Testing partition: {len(X_test)} samples")

    # 2. Build pipeline
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=4000,
                sublinear_tf=True,
                lowercase=True,
                strip_accents="unicode"
            )
        ),
        (
            "clf",
            LogisticRegression(
                C=1.5,
                class_weight="balanced",
                max_iter=1000,
                random_state=42,
                solver="lbfgs"
            )
        )
    ])

    # 3. Train
    print("Fitting TF-IDF Vectorizer and Multinomial/Logistic Classifier...")
    pipeline.fit(X_train, y_train)

    # 4. Evaluate on unseen test partition
    print("Evaluating pipeline performance on held-out test data...")
    metrics = evaluate_pipeline(pipeline, X_test, y_test)
    print(f"Benchmark Accuracy: {metrics['accuracy'] * 100:.2f}%")
    print(f"Macro F1-Score:     {metrics['macro_f1'] * 100:.2f}%")
    print(f"Per-Class Metrics:  {metrics['per_class']}")

    # 5. Persist artifacts
    settings.MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, settings.MODEL_PATH)
    print(f"Model artifact saved -> model.joblib")

    metadata = {
        "status": "trained",
        "version": settings.APP_VERSION,
        "algorithm": "TF-IDF (1-2 ngrams) + Regularized Logistic Regression (Balanced)",
        "vectorizer": "TfidfVectorizer(max_features=4000, sublinear_tf=True)",
        "target_classes": ["safe", "spam", "phishing"],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "name": "MailSentinel Curated Public Benchmark Corpus",
            "description": "Cross-sectional email security dataset containing verified ham, bulk spam, and credential phishing",
            "total_samples": int(len(df)),
            "distribution": {str(k): int(v) for k, v in counts.items()},
            "sources": DOCUMENTED_BENCHMARK_SOURCES,
        },
        "metrics": metrics,
        "disclaimer": (
            "Model confidence is an estimated statistical probability based on textual patterns, "
            "not a guarantee of email safety or legitimacy."
        )
    }

    with open(settings.METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Evaluation metrics saved -> {settings.METRICS_PATH}")
    print("=" * 60)
    print("Training successfully completed.")
    print("=" * 60)

    return metadata

if __name__ == "__main__":
    train_and_save_model()
