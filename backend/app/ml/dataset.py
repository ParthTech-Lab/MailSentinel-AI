from pathlib import Path
import pandas as pd
from typing import Tuple
from sklearn.model_selection import train_test_split
from ..config import settings

DOCUMENTED_BENCHMARK_SOURCES = [
    "Enron Email Corpus (Clean Business Communications / Ham)",
    "SpamAssassin Public Corpus (Unsolicited Commercial Bulk Email)",
    "Nazario Phishing Corpus & Anti-Phishing Working Group (APWG) Real-World Phishing Samples"
]

def ensure_dataset_exists(csv_path: Path = settings.DATASET_PATH) -> Path:
    """Ensures the benchmark dataset exists, creating the curated CSV if not found."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    if csv_path.exists() and csv_path.stat().st_size > 500:
        return csv_path

    from .curated_samples import BENCHMARK_SAMPLES
    df = pd.DataFrame(BENCHMARK_SAMPLES)
    df.to_csv(csv_path, index=False, encoding="utf-8")
    return csv_path

def load_dataset(csv_path: Path = settings.DATASET_PATH) -> pd.DataFrame:
    """Loads and validates the benchmark email dataset."""
    ensure_dataset_exists(csv_path)
    df = pd.read_csv(csv_path)
    
    required_cols = {"id", "label", "subject", "body", "source"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Dataset at {csv_path} is missing required columns: {missing}")
        
    df = df.dropna(subset=["label", "body"])
    df["label"] = df["label"].str.lower().str.strip()
    df["text"] = df["subject"].fillna("") + " " + df["body"].fillna("")
    return df

def get_train_test_data(
    test_size: float = 0.25, 
    random_state: int = 42
) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """Loads and splits the dataset into stratified training and testing partitions."""
    df = load_dataset()
    X = df["text"]
    y = df["label"]
    return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)

