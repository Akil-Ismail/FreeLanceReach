"""
Evaluation Service — Precision@K, Recall@K, MRR, NDCG
Runs BERT matching against labeled evaluation_dataset.json
"""

import json
import math
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "evaluation_dataset.json"


def precision_at_k(ranked_ids: list, relevant_ids: set, k: int) -> float:
    hits = sum(1 for rid in ranked_ids[:k] if rid in relevant_ids)
    return hits / k if k > 0 else 0.0


def recall_at_k(ranked_ids: list, relevant_ids: set, k: int) -> float:
    if not relevant_ids:
        return 0.0
    hits = sum(1 for rid in ranked_ids[:k] if rid in relevant_ids)
    return hits / len(relevant_ids)


def reciprocal_rank(ranked_ids: list, relevant_ids: set) -> float:
    for i, rid in enumerate(ranked_ids, start=1):
        if rid in relevant_ids:
            return 1.0 / i
    return 0.0


def _dcg(ranked_ids: list, relevant_ids: set, k: int) -> float:
    return sum(
        1.0 / math.log2(i + 1)
        for i, rid in enumerate(ranked_ids[:k], start=1)
        if rid in relevant_ids
    )


def ndcg_at_k(ranked_ids: list, relevant_ids: set, k: int) -> float:
    actual = _dcg(ranked_ids, relevant_ids, k)
    ideal_ranked = list(relevant_ids) + [x for x in ranked_ids if x not in relevant_ids]
    ideal = _dcg(ideal_ranked, relevant_ids, k)
    return actual / ideal if ideal > 0 else 0.0


def _rank_candidates(proposal: dict, candidates: list[dict]) -> list:
    """
    Returns candidate user_ids sorted by descending relevance score using BERT or Jaccard fallback.
    """
    try:
        from app.services.bert_matching_service import get_bert_matching_service
        bert = get_bert_matching_service()
        scored = bert.score_matches(proposal, candidates)
        return [item["user_id"] for item in scored]
    except Exception:
        pass

    # Jaccard fallback
    query = f"{proposal.get('title','')} {proposal.get('description','')} {' '.join(proposal.get('required_skills',[]))}"
    q_tokens = set(query.lower().split())

    scored = []
    for cand in candidates:
        cand_text = f"{cand.get('headline','')} {cand.get('bio','')} {' '.join(cand.get('skills',[]))}"
        c_tokens = set(cand_text.lower().split())
        union = q_tokens | c_tokens
        score = len(q_tokens & c_tokens) / len(union) if union else 0.0
        scored.append((cand["user_id"], score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [uid for uid, _ in scored]


def run_evaluation(split: str = "test") -> dict[str, Any]:
    """
    Runs the full evaluation on the specified split.
    Returns aggregate metrics and per-query details.
    """
    if not DATA_PATH.exists():
        return {"error": f"Evaluation dataset not found at {DATA_PATH}"}

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    all_samples = dataset.get("samples", [])
    samples = [s for s in all_samples if s.get("split") == split]

    if not samples:
        available = list({s.get("split") for s in all_samples})
        return {"error": f"No samples for split '{split}'. Available: {available}"}

    # Detect scoring method
    scoring_method = "jaccard_fallback"
    try:
        from app.services.bert_matching_service import get_bert_matching_service
        bert = get_bert_matching_service()
        bert.initialize()
        if bert.is_transformer_available():
            scoring_method = "bert_sentence_transformer"
    except Exception:
        pass

    k_values = [1, 3, 5]
    agg: dict[str, list[float]] = {f"precision@{k}": [] for k in k_values}
    agg.update({f"recall@{k}": [] for k in k_values})
    agg.update({f"ndcg@{k}": [] for k in k_values})
    rr_scores: list[float] = []

    per_query = []

    for sample in samples:
        proposal = sample["proposal"]
        candidates = sample["candidates"]
        relevant_ids = {c["user_id"] for c in candidates if c.get("label") == 1}

        ranked = _rank_candidates(proposal, candidates)

        row: dict[str, Any] = {
            "sample_id": sample["id"],
            "proposal_title": proposal.get("title", ""),
            "ranked_user_ids": ranked,
            "relevant_user_ids": list(relevant_ids),
            "metrics": {},
        }

        for k in k_values:
            p = precision_at_k(ranked, relevant_ids, k)
            r = recall_at_k(ranked, relevant_ids, k)
            n = ndcg_at_k(ranked, relevant_ids, k)
            row["metrics"][f"precision@{k}"] = round(p, 4)
            row["metrics"][f"recall@{k}"] = round(r, 4)
            row["metrics"][f"ndcg@{k}"] = round(n, 4)
            agg[f"precision@{k}"].append(p)
            agg[f"recall@{k}"].append(r)
            agg[f"ndcg@{k}"].append(n)

        rr = reciprocal_rank(ranked, relevant_ids)
        row["metrics"]["reciprocal_rank"] = round(rr, 4)
        rr_scores.append(rr)

        per_query.append(row)

    summary: dict[str, float] = {
        metric: round(sum(vals) / len(vals), 4) for metric, vals in agg.items() if vals
    }
    summary["mrr"] = round(sum(rr_scores) / len(rr_scores), 4) if rr_scores else 0.0

    return {
        "split": split,
        "num_samples": len(samples),
        "scoring_method": scoring_method,
        "aggregate_metrics": summary,
        "per_query_results": per_query,
    }
