from typing import Any
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

def evaluate_pipeline(pipeline: Any, X_test: Any, y_test: Any) -> dict[str, Any]:
    """
    Computes genuine evaluation metrics on the held-out test partition.
    Never fabricates figures; metrics derive strictly from ground-truth comparison.
    """
    y_pred = pipeline.predict(X_test)
    
    acc = float(accuracy_score(y_test, y_pred))
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    per_class = {}
    for cls in ["safe", "spam", "phishing"]:
        if cls in report:
            per_class[cls] = {
                "precision": round(float(report[cls]["precision"]), 4),
                "recall": round(float(report[cls]["recall"]), 4),
                "f1_score": round(float(report[cls]["f1-score"]), 4),
                "support": int(report[cls]["support"]),
            }
        else:
            per_class[cls] = {
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "support": 0,
            }

    macro = report.get("macro avg", {})
    weighted = report.get("weighted avg", {})

    return {
        "accuracy": round(acc, 4),
        "macro_precision": round(float(macro.get("precision", 0.0)), 4),
        "macro_recall": round(float(macro.get("recall", 0.0)), 4),
        "macro_f1": round(float(macro.get("f1-score", 0.0)), 4),
        "weighted_f1": round(float(weighted.get("f1-score", 0.0)), 4),
        "per_class": per_class,
        "confusion_matrix": cm,
        "evaluated_samples": int(len(y_test)),
    }

