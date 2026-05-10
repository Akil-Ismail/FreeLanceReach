"""
Evaluation Router — runs BERT matching evaluation against labeled dataset
"""

from fastapi import APIRouter, Query
from app.services.evaluation_service import run_evaluation

router = APIRouter()


@router.get("/run")
async def run_evaluation_endpoint(
    split: str = Query(default="test", description="Dataset split to evaluate: 'train' or 'test'")
):
    """
    Run evaluation metrics (Precision@K, Recall@K, MRR, NDCG) against the labeled dataset.

    - **split**: 'test' (default) or 'train'
    """
    result = run_evaluation(split=split)
    return result


@router.get("/health")
async def evaluation_health():
    """Check if evaluation dataset is accessible"""
    from pathlib import Path
    data_path = Path(__file__).resolve().parents[1] / "data" / "evaluation_dataset.json"
    if not data_path.exists():
        return {"status": "error", "message": "evaluation_dataset.json not found"}

    import json
    with open(data_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    samples = dataset.get("samples", [])
    return {
        "status": "ok",
        "train_samples": sum(1 for s in samples if s.get("split") == "train"),
        "test_samples": sum(1 for s in samples if s.get("split") == "test"),
    }
