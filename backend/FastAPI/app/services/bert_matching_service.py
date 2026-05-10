"""
BERT-based matching service for proposal to freelancer ranking.

Uses sentence-transformers for embeddings and Qdrant for ANN search.
Direct BERT scoring and Jaccard are available as fallbacks.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import math
import re

COLLECTION = "freelancer_profiles"
VECTOR_SIZE = 384


class BertMatchingService:
    def __init__(self) -> None:
        self.model = None
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.dataset: List[Dict[str, Any]] = []
        self._initialized = False
        self._qdrant = None

    def initialize(self) -> None:
        if self._initialized:
            return

        self._load_dataset()

        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
        except Exception:
            self.model = None

        self._init_qdrant()
        self._initialized = True

    def _init_qdrant(self) -> None:
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import Distance, VectorParams

            persist_path = str(Path(__file__).resolve().parents[2] / "qdrant_data")
            self._qdrant = QdrantClient(path=persist_path)

            collections = {c.name for c in self._qdrant.get_collections().collections}
            if COLLECTION not in collections:
                self._qdrant.create_collection(
                    collection_name=COLLECTION,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                )
        except Exception:
            self._qdrant = None

    def is_transformer_available(self) -> bool:
        return self.model is not None

    def is_qdrant_available(self) -> bool:
        return self._qdrant is not None

    def qdrant_count(self) -> int:
        if not self._qdrant:
            return 0
        try:
            info = self._qdrant.get_collection(COLLECTION)
            return info.points_count or 0
        except Exception:
            return 0

    def index_freelancer(self, user_id: int, profile: Dict[str, Any]) -> bool:
        """Encode a freelancer profile with BERT and upsert it into Qdrant."""
        self.initialize()
        if not self.model or not self._qdrant:
            return False
        try:
            from qdrant_client.models import PointStruct

            text = self._freelancer_text(profile)
            vector = self.model.encode(text, normalize_embeddings=True).tolist()

            self._qdrant.upsert(
                collection_name=COLLECTION,
                points=[
                    PointStruct(
                        id=user_id,
                        vector=vector,
                        payload={
                            "user_id": user_id,
                            "skills": profile.get("skills") or [],
                            "availability": profile.get("availability") or "",
                            "hourly_rate": profile.get("hourly_rate"),
                            "experience_level": profile.get("experience_level") or "",
                            "freelance_category": profile.get("freelance_category") or "",
                        },
                    )
                ],
            )
            return True
        except Exception:
            return False

    def search_qdrant(self, proposal: Dict[str, Any], top_k: int = 20) -> List[Dict[str, Any]]:
        """Encode a proposal and find the top-K matching freelancers via Qdrant ANN."""
        self.initialize()
        if not self.model or not self._qdrant:
            return []
        try:
            query_vector = self.model.encode(
                self._proposal_text(proposal), normalize_embeddings=True
            ).tolist()

            hits = self._qdrant.query_points(
                collection_name=COLLECTION,
                query=query_vector,
                limit=top_k,
            ).points

            results = []
            for hit in hits:
                payload = hit.payload or {}
                semantic_score = float(hit.score)
                keyword_boost = self._keyword_boost(
                    proposal, {"skills": payload.get("skills", [])}
                )
                final_score = max(0.0, min(1.0, semantic_score + keyword_boost))
                results.append(
                    {
                        "user_id": payload.get("user_id", hit.id),
                        "score": round(final_score, 4),
                        "semantic_score": round(semantic_score, 4),
                        "keyword_boost": round(keyword_boost, 4),
                        "model_source": "qdrant_bert",
                    }
                )
            return results
        except Exception:
            return []

    def score_matches(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Direct BERT scoring against a provided freelancer list (fallback path)."""
        self.initialize()
        if self.model is not None:
            return self._score_with_transformer(proposal, freelancers)
        return self._score_with_overlap(proposal, freelancers)

    def _score_with_transformer(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        proposal_text = self._proposal_text(proposal)
        freelancer_texts = [self._freelancer_text(f) for f in freelancers]

        proposal_vector = self.model.encode(proposal_text, normalize_embeddings=True)
        freelancer_vectors = self.model.encode(freelancer_texts, normalize_embeddings=True)

        results: List[Dict[str, Any]] = []
        for freelancer, vector in zip(freelancers, freelancer_vectors):
            score = float(self._cosine_similarity(proposal_vector, vector))
            keyword_boost = self._keyword_boost(proposal, freelancer)
            final_score = max(0.0, min(1.0, score + keyword_boost))

            results.append(
                {
                    "user_id": freelancer.get("user_id"),
                    "score": round(final_score, 4),
                    "semantic_score": round(max(0.0, min(1.0, score)), 4),
                    "keyword_boost": round(keyword_boost, 4),
                    "model_source": "bert_sentence_transformer",
                }
            )

        results.sort(key=lambda item: item["score"], reverse=True)
        return results

    def _score_with_overlap(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        proposal_tokens = set(self._tokenize(self._proposal_text(proposal)))

        results: List[Dict[str, Any]] = []
        for freelancer in freelancers:
            freelancer_tokens = set(self._tokenize(self._freelancer_text(freelancer)))
            intersection = len(proposal_tokens.intersection(freelancer_tokens))
            union = len(proposal_tokens.union(freelancer_tokens))
            score = (intersection / union) if union else 0.0
            keyword_boost = self._keyword_boost(proposal, freelancer)
            final_score = max(0.0, min(1.0, score + keyword_boost))

            results.append(
                {
                    "user_id": freelancer.get("user_id"),
                    "score": round(final_score, 4),
                    "semantic_score": round(score, 4),
                    "keyword_boost": round(keyword_boost, 4),
                    "model_source": "fallback_overlap",
                }
            )

        results.sort(key=lambda item: item["score"], reverse=True)
        return results

    def _keyword_boost(self, proposal: Dict[str, Any], freelancer: Dict[str, Any]) -> float:
        proposal_skills = {
            str(s).strip().lower()
            for s in (proposal.get("required_skills") or [])
            if str(s).strip()
        }
        freelancer_skills = {
            str(s).strip().lower()
            for s in (freelancer.get("skills") or [])
            if str(s).strip()
        }

        if not proposal_skills:
            return 0.0

        overlap = len(proposal_skills.intersection(freelancer_skills))
        ratio = overlap / len(proposal_skills)

        dataset_bonus = 0.0
        if self.dataset:
            proposal_text = self._proposal_text(proposal).lower()
            freelancer_text = self._freelancer_text(freelancer).lower()
            for row in self.dataset:
                phrase = str(row.get("skill_phrase", "")).strip().lower()
                if phrase and phrase in proposal_text and phrase in freelancer_text:
                    dataset_bonus += float(row.get("boost", 0.0))

        return min(0.3, (ratio * 0.2) + dataset_bonus)

    def _proposal_text(self, proposal: Dict[str, Any]) -> str:
        title = str(proposal.get("title") or "")
        description = str(proposal.get("description") or "")
        skills = ", ".join(str(s) for s in (proposal.get("required_skills") or []))
        budget_min = proposal.get("budget_min")
        budget_max = proposal.get("budget_max")
        timeline = str(proposal.get("timeline") or "")

        parts = [title, description, f"Required skills: {skills}"]
        if budget_min is not None or budget_max is not None:
            parts.append(f"Budget: ${budget_min or '?'}–${budget_max or '?'}")
        if timeline:
            parts.append(f"Timeline: {timeline}")

        return "\n".join(p for p in parts if p.strip()).strip()

    def _freelancer_text(self, freelancer: Dict[str, Any]) -> str:
        headline = str(freelancer.get("headline") or "")
        bio = str(freelancer.get("bio") or "")
        level = str(freelancer.get("experience_level") or "")
        skills = ", ".join(str(s) for s in (freelancer.get("skills") or []))
        availability = str(freelancer.get("availability") or "")
        hourly_rate = freelancer.get("hourly_rate")
        category = str(freelancer.get("freelance_category") or "")

        parts = [headline, bio, f"Experience: {level}", f"Skills: {skills}"]
        if category:
            parts.append(f"Category: {category}")
        if availability:
            parts.append(f"Availability: {availability}")
        if hourly_rate is not None:
            parts.append(f"Hourly rate: ${hourly_rate}")

        return "\n".join(p for p in parts if p.strip()).strip()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"[a-zA-Z0-9\+\#\.]+", text.lower())

    def _cosine_similarity(self, a: Any, b: Any) -> float:
        dot = norm_a = norm_b = 0.0
        for ai, bi in zip(a, b):
            dot += float(ai) * float(bi)
            norm_a += float(ai) * float(ai)
            norm_b += float(bi) * float(bi)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))

    def _load_dataset(self) -> None:
        dataset_path = Path(__file__).resolve().parents[1] / "data" / "bert_matching_dataset.json"
        if dataset_path.exists():
            try:
                self.dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
            except Exception:
                self.dataset = []


_matching_service: Optional[BertMatchingService] = None


def get_bert_matching_service() -> BertMatchingService:
    global _matching_service
    if _matching_service is None:
        _matching_service = BertMatchingService()
    return _matching_service
