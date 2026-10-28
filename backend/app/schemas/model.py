from pydantic import BaseModel, Field
from typing import Optional, Literal

class ClassMetric(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int

class ModelEvaluationMetrics(BaseModel):
    accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    weighted_f1: float
    per_class: dict[str, ClassMetric]
    confusion_matrix: list[list[int]]
    evaluated_samples: int

class DatasetMetadata(BaseModel):
    name: str
    description: str
    total_samples: int
    distribution: dict[str, int]
    sources: list[str]

class ModelInfoResponse(BaseModel):
    status: Literal["trained", "uninitialized", "missing_dataset", "error"]
    version: str
    algorithm: str
    vectorizer: str
    target_classes: list[str]
    trained_at: Optional[str] = None
    dataset: Optional[DatasetMetadata] = None
    metrics: Optional[ModelEvaluationMetrics] = None
    disclaimer: str = Field(
        default="Accuracy and confidence figures are computed strictly against the offline benchmark validation set. Real-world performance depends on evolving attacker tactics."
    )

