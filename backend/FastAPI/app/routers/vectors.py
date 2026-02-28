"""
Vector database API endpoints

Handles all vector database operations including:
- Adding documents/embeddings
- Similarity search
- Collection management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.vector_service import get_vector_service

router = APIRouter()


# Request/Response Models
class AddDocumentsRequest(BaseModel):
    """Request model for adding documents"""
    collection: str
    documents: List[str]
    metadatas: Optional[List[Dict[str, Any]]] = None
    ids: Optional[List[str]] = None


class AddEmbeddingsRequest(BaseModel):
    """Request model for adding embeddings"""
    collection: str
    embeddings: List[List[float]]
    documents: Optional[List[str]] = None
    metadatas: Optional[List[Dict[str, Any]]] = None
    ids: Optional[List[str]] = None


class QueryRequest(BaseModel):
    """Request model for querying"""
    collection: str
    query_texts: List[str]
    n_results: int = 5
    where: Optional[Dict[str, Any]] = None


class QueryByEmbeddingRequest(BaseModel):
    """Request model for querying by embedding"""
    collection: str
    query_embeddings: List[List[float]]
    n_results: int = 5
    where: Optional[Dict[str, Any]] = None


class DeleteRequest(BaseModel):
    """Request model for deletion"""
    collection: str
    ids: Optional[List[str]] = None
    where: Optional[Dict[str, Any]] = None


# Endpoints
@router.get("/collections")
async def list_collections():
    """List all collections in the vector database"""
    try:
        vector_db = get_vector_service()
        collections = vector_db.list_collections()
        return {
            "collections": collections,
            "count": len(collections)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections/{collection_name}")
async def get_collection_info(collection_name: str):
    """Get information about a specific collection"""
    try:
        vector_db = get_vector_service()
        info = vector_db.get_collection_info(collection_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collections/{collection_name}")
async def create_collection(collection_name: str):
    """Create a new collection"""
    try:
        vector_db = get_vector_service()
        result = vector_db.create_collection(collection_name)
        return {
            "message": f"Collection '{collection_name}' created successfully",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a collection"""
    try:
        vector_db = get_vector_service()
        result = vector_db.delete_collection(collection_name)
        return {
            "message": f"Collection '{collection_name}' deleted successfully",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents")
async def add_documents(request: AddDocumentsRequest):
    """
    Add documents to a collection
    
    Documents will be automatically embedded by ChromaDB
    """
    try:
        vector_db = get_vector_service()
        result = vector_db.add_documents(
            collection_name=request.collection,
            documents=request.documents,
            metadatas=request.metadatas,
            ids=request.ids
        )
        return {
            "message": "Documents added successfully",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embeddings")
async def add_embeddings(request: AddEmbeddingsRequest):
    """
    Add pre-computed embeddings to a collection
    
    Use this when you have your own embedding model
    """
    try:
        vector_db = get_vector_service()
        result = vector_db.add_embeddings(
            collection_name=request.collection,
            embeddings=request.embeddings,
            documents=request.documents,
            metadatas=request.metadatas,
            ids=request.ids
        )
        return {
            "message": "Embeddings added successfully",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_documents(request: QueryRequest):
    """
    Query documents by text similarity
    
    Returns the most similar documents to the query texts
    """
    try:
        vector_db = get_vector_service()
        results = vector_db.query(
            collection_name=request.collection,
            query_texts=request.query_texts,
            n_results=request.n_results,
            where=request.where
        )
        return {
            "results": results,
            "collection": request.collection,
            "query_count": len(request.query_texts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query/embedding")
async def query_by_embedding(request: QueryByEmbeddingRequest):
    """
    Query documents by embedding similarity
    
    Use this when you have pre-computed query embeddings
    """
    try:
        vector_db = get_vector_service()
        results = vector_db.query_by_embedding(
            collection_name=request.collection,
            query_embeddings=request.query_embeddings,
            n_results=request.n_results,
            where=request.where
        )
        return {
            "results": results,
            "collection": request.collection
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents")
async def delete_documents(request: DeleteRequest):
    """Delete documents from a collection"""
    try:
        vector_db = get_vector_service()
        result = vector_db.delete_documents(
            collection_name=request.collection,
            ids=request.ids,
            where=request.where
        )
        return {
            "message": "Documents deleted successfully",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_database():
    """
    Reset the entire vector database
    
    WARNING: This will delete all data!
    """
    try:
        vector_db = get_vector_service()
        result = vector_db.reset_database()
        return {
            "message": "Database reset successfully",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
