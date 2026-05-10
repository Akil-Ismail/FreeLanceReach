"""
Matching router for BERT-based proposal-freelancer matching.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.bert_matching_service import get_bert_matching_service

router = APIRouter()


class ProposalPayload(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    timeline: Optional[str] = None


class FreelancerPayload(BaseModel):
    user_id: int
    headline: Optional[str] = None
    skills: List[str] = []
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    hourly_rate: Optional[float] = None
    freelance_category: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class MatchingRequest(BaseModel):
    proposal: ProposalPayload
    freelancers: List[FreelancerPayload]


class IndexProfileRequest(BaseModel):
    user_id: int
    headline: Optional[str] = None
    skills: List[str] = []
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    hourly_rate: Optional[float] = None
    freelance_category: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class SearchRequest(BaseModel):
    proposal: ProposalPayload
    top_k: int = 20


@router.post("/bert-score")
async def bert_score(request: MatchingRequest) -> Dict[str, Any]:
    service = get_bert_matching_service()
    matches = service.score_matches(
        proposal=request.proposal.model_dump(),
        freelancers=[f.model_dump() for f in request.freelancers],
    )
    return {
        "matches": matches,
        "model": "bert_sentence_transformer" if service.is_transformer_available() else "fallback_overlap",
        "count": len(matches),
    }


@router.post("/index-profile")
async def index_profile(request: IndexProfileRequest) -> Dict[str, Any]:
    service = get_bert_matching_service()
    success = service.index_freelancer(request.user_id, request.model_dump())
    return {
        "indexed": success,
        "user_id": request.user_id,
        "qdrant_available": service.is_qdrant_available(),
        "transformer_available": service.is_transformer_available(),
        "total_indexed": service.qdrant_count(),
    }


@router.post("/search")
async def search_freelancers(request: SearchRequest) -> Dict[str, Any]:
    service = get_bert_matching_service()
    matches = service.search_qdrant(request.proposal.model_dump(), top_k=request.top_k)
    return {
        "matches": matches,
        "model": "qdrant_bert" if matches else "no_results",
        "count": len(matches),
        "qdrant_indexed": service.qdrant_count(),
    }


@router.get("/health")
async def matching_health() -> Dict[str, Any]:
    service = get_bert_matching_service()
    service.initialize()
    return {
        "service": "matching",
        "transformer_available": service.is_transformer_available(),
        "qdrant_available": service.is_qdrant_available(),
        "qdrant_indexed_count": service.qdrant_count(),
        "model": "sentence-transformers/all-MiniLM-L6-v2",
    }
