"""
BERT-based matching service for proposal-to-freelancer ranking.

Multi-signal scoring pipeline:
  final = 0.40 * semantic_bert
        + 0.25 * skill_f1
        + 0.15 * budget_compat
        + 0.10 * experience_fit
        + 0.10 * availability_fit

Uses sentence-transformers/all-mpnet-base-v2 (768-dim) for richer semantics.
Qdrant handles ANN retrieval; re-ranking applies structured signals on top.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

COLLECTION = "freelancer_profiles_v2"   # v2 = 768-dim; old 384-dim collection stays untouched
VECTOR_SIZE = 768

# Weighted signal contributions (must sum to 1.0)
W_SEMANTIC    = 0.40
W_SKILL_F1    = 0.25
W_BUDGET      = 0.15
W_EXPERIENCE  = 0.10
W_AVAILABILITY = 0.10

# Experience level → numeric seniority (0-4)
EXPERIENCE_RANK: Dict[str, int] = {
    "entry":        0,
    "junior":       0,
    "intermediate": 1,
    "mid":          1,
    "senior":       2,
    "expert":       3,
    "lead":         3,
    "principal":    4,
}

# Words in timeline / title that imply seniority requirements
SENIORITY_WORDS = {
    "intern":       0,
    "junior":       0,
    "entry":        0,
    "mid":          1,
    "intermediate": 1,
    "senior":       2,
    "lead":         3,
    "expert":       3,
    "principal":    4,
    "architect":    4,
}

# Availability keyword buckets
AVAILABILITY_FULL   = {"full", "full-time", "fulltime", "40h", "40 hours"}
AVAILABILITY_PART   = {"part", "part-time", "parttime", "20h", "20 hours", "half"}
AVAILABILITY_HOURLY = {"hourly", "contract", "freelance", "flexible"}


class BertMatchingService:
    def __init__(self) -> None:
        self.model = None
        self.model_name = "sentence-transformers/all-mpnet-base-v2"
        self.dataset: List[Dict[str, Any]] = []
        self._initialized = False
        self._qdrant = None

    # ------------------------------------------------------------------ init

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
            return self._qdrant.get_collection(COLLECTION).points_count or 0
        except Exception:
            return 0

    # ------------------------------------------------------------------ indexing

    def index_freelancer(self, user_id: int, profile: Dict[str, Any]) -> bool:
        """Encode a freelancer profile with BERT and upsert into Qdrant."""
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
                            "user_id":           user_id,
                            "skills":            profile.get("skills") or [],
                            "availability":      profile.get("availability") or "",
                            "hourly_rate":       profile.get("hourly_rate"),
                            "experience_level":  profile.get("experience_level") or "",
                            "freelance_category": profile.get("freelance_category") or "",
                        },
                    )
                ],
            )
            return True
        except Exception:
            return False

    # ------------------------------------------------------------------ ANN search

    def search_qdrant(self, proposal: Dict[str, Any], top_k: int = 20) -> List[Dict[str, Any]]:
        """Encode proposal, ANN search, apply keyword boost."""
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
                freelancer_stub = {
                    "skills":           payload.get("skills", []),
                    "hourly_rate":      payload.get("hourly_rate"),
                    "experience_level": payload.get("experience_level", ""),
                    "availability":     payload.get("availability", ""),
                }
                semantic = float(hit.score)
                signals = self._multi_signal_score(proposal, freelancer_stub, semantic_score=semantic)
                results.append({
                    "user_id":          payload.get("user_id", hit.id),
                    "score":            round(signals["final"], 4),
                    "semantic_score":   round(semantic, 4),
                    "skill_f1":         round(signals["skill_f1"], 4),
                    "budget_compat":    round(signals["budget_compat"], 4),
                    "experience_fit":   round(signals["experience_fit"], 4),
                    "availability_fit": round(signals["availability_fit"], 4),
                    "model_source":     "qdrant_bert_v2",
                })
            return results
        except Exception:
            return []

    # ------------------------------------------------------------------ direct scoring

    def score_matches(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Direct multi-signal BERT scoring (fallback path when freelancer not in Qdrant)."""
        self.initialize()
        if self.model is not None:
            return self._score_with_transformer(proposal, freelancers)
        return self._score_with_overlap(proposal, freelancers)

    def rerank(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Re-rank a candidate shortlist with full multi-signal scoring.
        Called after Qdrant ANN to refine results using complete profile data.
        """
        self.initialize()
        return self._score_with_transformer(proposal, freelancers) if self.model else \
               self._score_with_overlap(proposal, freelancers)

    def _score_with_transformer(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        proposal_text = self._proposal_text(proposal)
        freelancer_texts = [self._freelancer_text(f) for f in freelancers]

        proposal_vec = self.model.encode(proposal_text, normalize_embeddings=True)
        freelancer_vecs = self.model.encode(freelancer_texts, normalize_embeddings=True)

        results: List[Dict[str, Any]] = []
        for freelancer, vec in zip(freelancers, freelancer_vecs):
            semantic = float(self._cosine_similarity(proposal_vec, vec))
            signals = self._multi_signal_score(proposal, freelancer, semantic_score=semantic)
            results.append({
                "user_id":          freelancer.get("user_id"),
                "score":            round(signals["final"], 4),
                "semantic_score":   round(semantic, 4),
                "skill_f1":         round(signals["skill_f1"], 4),
                "budget_compat":    round(signals["budget_compat"], 4),
                "experience_fit":   round(signals["experience_fit"], 4),
                "availability_fit": round(signals["availability_fit"], 4),
                "model_source":     "bert_mpnet_multisignal",
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    def _score_with_overlap(
        self, proposal: Dict[str, Any], freelancers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Token-overlap fallback when BERT unavailable."""
        proposal_tokens = set(self._tokenize(self._proposal_text(proposal)))
        results: List[Dict[str, Any]] = []
        for freelancer in freelancers:
            fl_tokens = set(self._tokenize(self._freelancer_text(freelancer)))
            union = len(proposal_tokens | fl_tokens)
            semantic = len(proposal_tokens & fl_tokens) / union if union else 0.0
            signals = self._multi_signal_score(proposal, freelancer, semantic_score=semantic)
            results.append({
                "user_id":          freelancer.get("user_id"),
                "score":            round(signals["final"], 4),
                "semantic_score":   round(semantic, 4),
                "skill_f1":         round(signals["skill_f1"], 4),
                "budget_compat":    round(signals["budget_compat"], 4),
                "experience_fit":   round(signals["experience_fit"], 4),
                "availability_fit": round(signals["availability_fit"], 4),
                "model_source":     "fallback_overlap",
            })
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    # ------------------------------------------------------------------ multi-signal scoring

    def _multi_signal_score(
        self,
        proposal: Dict[str, Any],
        freelancer: Dict[str, Any],
        semantic_score: float = 0.0,
    ) -> Dict[str, float]:
        skill_f1    = self._skill_f1(proposal, freelancer)
        budget      = self._budget_compat(proposal, freelancer)
        experience  = self._experience_fit(proposal, freelancer)
        availability = self._availability_fit(proposal, freelancer)

        final = (
            W_SEMANTIC     * semantic_score
            + W_SKILL_F1   * skill_f1
            + W_BUDGET     * budget
            + W_EXPERIENCE * experience
            + W_AVAILABILITY * availability
        )
        final = max(0.0, min(1.0, final))

        return {
            "final":           final,
            "skill_f1":        skill_f1,
            "budget_compat":   budget,
            "experience_fit":  experience,
            "availability_fit": availability,
        }

    def _skill_f1(self, proposal: Dict[str, Any], freelancer: Dict[str, Any]) -> float:
        """
        F1 score of skill overlap.
        Precision = what fraction of required skills the freelancer has.
        Recall    = what fraction of freelancer skills are relevant.
        F1 balances both — rewards specialists who match well.
        """
        required = {self._norm_skill(s) for s in (proposal.get("required_skills") or []) if s}
        has      = {self._norm_skill(s) for s in (freelancer.get("skills") or []) if s}

        if not required:
            return 0.5  # neutral when proposal lists no skills

        overlap   = len(required & has)
        precision = overlap / len(required)
        recall    = (overlap / len(has)) if has else 0.0

        if precision + recall == 0:
            return 0.0
        return 2 * precision * recall / (precision + recall)

    def _budget_compat(self, proposal: Dict[str, Any], freelancer: Dict[str, Any]) -> float:
        """
        Compare freelancer hourly_rate against proposal budget range.
        Estimates hours from timeline; falls back to 40h if absent.
        """
        hourly = freelancer.get("hourly_rate")
        bmin   = proposal.get("budget_min")
        bmax   = proposal.get("budget_max")

        if hourly is None or (bmin is None and bmax is None):
            return 0.5  # neutral — no data

        try:
            hourly = float(hourly)
        except (TypeError, ValueError):
            return 0.5

        hours = self._estimate_hours(str(proposal.get("timeline") or ""))
        estimated_cost = hourly * hours

        lo = float(bmin) if bmin is not None else 0.0
        hi = float(bmax) if bmax is not None else float("inf")

        if lo <= estimated_cost <= hi:
            return 1.0
        # Partial credit within 30% buffer
        buffer = max(lo, hi) * 0.30 if max(lo, hi) > 0 else 1000
        if estimated_cost < lo:
            gap = lo - estimated_cost
        else:
            gap = estimated_cost - hi
        return max(0.0, 1.0 - gap / (buffer + 1e-9))

    def _experience_fit(self, proposal: Dict[str, Any], freelancer: Dict[str, Any]) -> float:
        """
        Compare required seniority (inferred from title/description) to freelancer level.
        Penalty for under-qualified; slight penalty for over-qualified (overkill = rarely applies).
        """
        required_level = self._infer_seniority(
            (proposal.get("title") or "") + " " + (proposal.get("description") or "")
        )
        freelancer_level = EXPERIENCE_RANK.get(
            str(freelancer.get("experience_level") or "").strip().lower(), -1
        )

        if required_level == -1 and freelancer_level == -1:
            return 0.5
        if required_level == -1 or freelancer_level == -1:
            return 0.6  # partial info

        diff = freelancer_level - required_level
        if diff == 0:
            return 1.0
        if diff == 1:
            return 0.85   # slightly over-qualified
        if diff == -1:
            return 0.55   # slightly under
        if diff >= 2:
            return 0.65   # over-qualified — unlikely to accept
        return 0.25       # notably under-qualified

    def _availability_fit(self, proposal: Dict[str, Any], freelancer: Dict[str, Any]) -> float:
        """
        Check if freelancer availability aligns with the implied time commitment in timeline.
        """
        avail    = str(freelancer.get("availability") or "").lower()
        timeline = str(proposal.get("timeline") or "").lower()

        if not avail:
            return 0.5

        avail_bucket = self._avail_bucket(avail)
        # Infer commitment from timeline length
        if any(w in timeline for w in ("month", "week", "ongoing", "long")):
            needed = "full"
        elif any(w in timeline for w in ("day", "hour", "quick", "small", "minor")):
            needed = "hourly"
        else:
            needed = "part"

        if avail_bucket == needed:
            return 1.0
        if {avail_bucket, needed} == {"full", "part"}:
            return 0.7
        if {avail_bucket, needed} == {"part", "hourly"}:
            return 0.7
        return 0.4

    # ------------------------------------------------------------------ text construction

    def _proposal_text(self, proposal: Dict[str, Any]) -> str:
        title  = str(proposal.get("title") or "")
        desc   = str(proposal.get("description") or "")
        skills = ", ".join(str(s) for s in (proposal.get("required_skills") or []))
        timeline = str(proposal.get("timeline") or "")

        # Repeat skills and title to up-weight them in the embedding
        parts = [
            title, title,
            desc,
            f"Required skills: {skills}",
            f"Skills needed: {skills}",
        ]
        if timeline:
            parts.append(f"Timeline: {timeline}")
        return "\n".join(p for p in parts if p.strip())

    def _freelancer_text(self, freelancer: Dict[str, Any]) -> str:
        headline  = str(freelancer.get("headline") or "")
        bio       = str(freelancer.get("bio") or "")
        level     = str(freelancer.get("experience_level") or "")
        skills    = ", ".join(str(s) for s in (freelancer.get("skills") or []))
        avail     = str(freelancer.get("availability") or "")
        category  = str(freelancer.get("freelance_category") or "")
        rate      = freelancer.get("hourly_rate")

        # Repeat headline and skills to up-weight them
        parts = [
            headline, headline,
            bio,
            f"Skills: {skills}",
            f"Expert in: {skills}",
            f"Experience: {level}",
        ]
        if category:
            parts.append(f"Category: {category}")
        if avail:
            parts.append(f"Availability: {avail}")
        if rate is not None:
            parts.append(f"Hourly rate: ${rate}")
        return "\n".join(p for p in parts if p.strip())

    # ------------------------------------------------------------------ helpers

    def _norm_skill(self, skill: str) -> str:
        """Lowercase, strip, collapse whitespace for skill comparison."""
        return re.sub(r"\s+", " ", str(skill).strip().lower())

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"[a-zA-Z0-9\+\#\.]+", text.lower())

    def _cosine_similarity(self, a: Any, b: Any) -> float:
        dot = norm_a = norm_b = 0.0
        for ai, bi in zip(a, b):
            dot   += float(ai) * float(bi)
            norm_a += float(ai) * float(ai)
            norm_b += float(bi) * float(bi)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))

    def _infer_seniority(self, text: str) -> int:
        """Return numeric seniority inferred from text, or -1 if none found."""
        text_lower = text.lower()
        found = -1
        for word, rank in SENIORITY_WORDS.items():
            if word in text_lower:
                found = max(found, rank)
        return found

    def _avail_bucket(self, avail: str) -> str:
        tokens = set(re.findall(r"[a-z0-9\-]+", avail))
        if tokens & AVAILABILITY_FULL:
            return "full"
        if tokens & AVAILABILITY_PART:
            return "part"
        return "hourly"

    def _estimate_hours(self, timeline: str) -> float:
        """Estimate total hours from a timeline string, default 40h."""
        tl = timeline.lower()
        # Try to parse patterns like "2 weeks", "3 months", "1 month"
        m = re.search(r"(\d+)\s*(week|month|day)", tl)
        if not m:
            return 40.0
        n = int(m.group(1))
        unit = m.group(2)
        if unit == "day":
            return n * 8.0
        if unit == "week":
            return n * 40.0
        if unit == "month":
            return n * 160.0
        return 40.0

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
