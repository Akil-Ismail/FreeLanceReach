"""
Health check endpoints
"""

from fastapi import APIRouter
from app.services.vector_service import get_vector_service

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "Freelance Reach AI API"
    }


@router.get("/health/db")
async def database_health():
    """Check Qdrant vector database connection health"""
    try:
        vector_db = get_vector_service()
        collections = vector_db.list_collections()
        return {
            "status": "healthy",
            "database": "Qdrant",
            "collections_count": len(collections),
            "collections": collections
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "Qdrant",
            "error": str(e)
        }
