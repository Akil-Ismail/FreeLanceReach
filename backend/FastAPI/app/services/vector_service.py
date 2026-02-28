"""
Qdrant Vector Database Service

This service handles all vector database operations including:
- Storing embeddings
- Similarity search
- Collection management

Uses Qdrant in-memory mode for development (no server required)
"""

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue
)
from typing import List, Dict, Any, Optional
import uuid
import hashlib


class VectorService:
    """Service class for Qdrant vector database operations"""
    
    def __init__(self, persist_path: str = None):
        """
        Initialize Qdrant service
        
        Args:
            persist_path: Optional path to persist the database (None for in-memory)
        """
        self.persist_path = persist_path
        self.client = None
        self.vector_size = 384  # Default size for simple text embeddings
    
    def initialize(self):
        """Initialize the Qdrant client"""
        if self.persist_path:
            # Persistent storage
            self.client = QdrantClient(path=self.persist_path)
        else:
            # In-memory storage (for development)
            self.client = QdrantClient(":memory:")
        
        # Create default collections
        self._create_default_collections()
    
    def _create_default_collections(self):
        """Create default collections for the application"""
        default_collections = [
            "proposals",           # Store proposal templates and examples
            "job_descriptions",    # Store job descriptions for matching
            "freelancer_profiles", # Store freelancer profile embeddings
            "company_profiles"     # Store company profile embeddings
        ]
        
        for collection_name in default_collections:
            self.create_collection(collection_name)
    
    def _text_to_embedding(self, text: str) -> List[float]:
        """
        Simple text to embedding conversion using hash-based approach
        For production, use sentence-transformers or OpenAI embeddings
        
        Args:
            text: Input text
            
        Returns:
            List of floats representing the embedding
        """
        # Create a simple hash-based embedding
        # In production, replace with actual embedding model
        text_bytes = text.lower().encode('utf-8')
        hash_obj = hashlib.sha384(text_bytes)
        hash_bytes = hash_obj.digest()
        
        # Convert to floats and normalize
        embedding = [b / 255.0 for b in hash_bytes[:self.vector_size]]
        
        # Pad or truncate to vector_size
        if len(embedding) < self.vector_size:
            embedding.extend([0.0] * (self.vector_size - len(embedding)))
        
        return embedding[:self.vector_size]
    
    def create_collection(self, name: str) -> Dict[str, Any]:
        """
        Create a collection if it doesn't exist
        
        Args:
            name: Collection name
            
        Returns:
            Result dict
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            exists = any(c.name == name for c in collections)
            
            if not exists:
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                return {"created": True, "collection": name}
            return {"created": False, "collection": name, "message": "Already exists"}
        except Exception as e:
            return {"error": str(e), "collection": name}
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Add documents to a collection (auto-generates embeddings)
        
        Args:
            collection_name: Name of the collection
            documents: List of text documents
            metadatas: Optional list of metadata dicts
            ids: Optional list of IDs (auto-generated if not provided)
            
        Returns:
            Response with added IDs
        """
        # Ensure collection exists
        self.create_collection(collection_name)
        
        # Generate IDs if not provided
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in documents]
        
        # Create points
        points = []
        for i, doc in enumerate(documents):
            embedding = self._text_to_embedding(doc)
            metadata = metadatas[i] if metadatas else {}
            metadata["document"] = doc  # Store original document
            
            points.append(PointStruct(
                id=ids[i] if isinstance(ids[i], int) else hash(ids[i]) % (10**9),
                vector=embedding,
                payload=metadata
            ))
        
        # Upsert points
        self.client.upsert(
            collection_name=collection_name,
            points=points
        )
        
        return {"added_ids": ids, "collection": collection_name, "count": len(documents)}
    
    def add_embeddings(
        self,
        collection_name: str,
        embeddings: List[List[float]],
        documents: Optional[List[str]] = None,
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Add pre-computed embeddings to a collection
        
        Args:
            collection_name: Name of the collection
            embeddings: List of embedding vectors
            documents: Optional list of original documents
            metadatas: Optional list of metadata dicts
            ids: Optional list of IDs
            
        Returns:
            Response with added IDs
        """
        # Ensure collection exists
        self.create_collection(collection_name)
        
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in embeddings]
        
        points = []
        for i, embedding in enumerate(embeddings):
            metadata = metadatas[i] if metadatas else {}
            if documents and i < len(documents):
                metadata["document"] = documents[i]
            
            points.append(PointStruct(
                id=ids[i] if isinstance(ids[i], int) else hash(ids[i]) % (10**9),
                vector=embedding,
                payload=metadata
            ))
        
        self.client.upsert(
            collection_name=collection_name,
            points=points
        )
        
        return {"added_ids": ids, "collection": collection_name, "count": len(embeddings)}
    
    def query(
        self,
        collection_name: str,
        query_texts: List[str],
        n_results: int = 5,
        where: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Query collection using text (auto-generates embedding)
        
        Args:
            collection_name: Name of the collection
            query_texts: List of query texts
            n_results: Number of results to return
            where: Optional filter conditions
            
        Returns:
            Query results
        """
        all_results = []
        
        for query_text in query_texts:
            query_embedding = self._text_to_embedding(query_text)
            
            # Build filter if provided
            query_filter = None
            if where:
                conditions = []
                for key, value in where.items():
                    conditions.append(FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    ))
                query_filter = Filter(must=conditions)
            
            results = self.client.query_points(
                collection_name=collection_name,
                query=query_embedding,
                limit=n_results,
                query_filter=query_filter
            ).points
            
            all_results.append({
                "query": query_text,
                "matches": [
                    {
                        "id": str(r.id),
                        "score": r.score,
                        "document": r.payload.get("document", ""),
                        "metadata": {k: v for k, v in r.payload.items() if k != "document"}
                    }
                    for r in results
                ]
            })
        
        return {"results": all_results, "collection": collection_name}
    
    def query_by_embedding(
        self,
        collection_name: str,
        query_embeddings: List[List[float]],
        n_results: int = 5,
        where: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Query collection using pre-computed embeddings
        
        Args:
            collection_name: Name of the collection
            query_embeddings: List of query embedding vectors
            n_results: Number of results to return
            where: Optional filter conditions
            
        Returns:
            Query results
        """
        all_results = []
        
        for query_embedding in query_embeddings:
            query_filter = None
            if where:
                conditions = []
                for key, value in where.items():
                    conditions.append(FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    ))
                query_filter = Filter(must=conditions)
            
            results = self.client.query_points(
                collection_name=collection_name,
                query=query_embedding,
                limit=n_results,
                query_filter=query_filter
            ).points
            
            all_results.append({
                "matches": [
                    {
                        "id": str(r.id),
                        "score": r.score,
                        "document": r.payload.get("document", ""),
                        "metadata": {k: v for k, v in r.payload.items() if k != "document"}
                    }
                    for r in results
                ]
            })
        
        return {"results": all_results, "collection": collection_name}
    
    def delete_documents(
        self,
        collection_name: str,
        ids: Optional[List[str]] = None,
        where: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Delete documents from a collection
        
        Args:
            collection_name: Name of the collection
            ids: List of IDs to delete
            where: Filter conditions for deletion
            
        Returns:
            Deletion result
        """
        if ids:
            point_ids = [hash(id) % (10**9) if isinstance(id, str) else id for id in ids]
            self.client.delete(
                collection_name=collection_name,
                points_selector=point_ids
            )
        
        return {"deleted": True, "collection": collection_name}
    
    def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """
        Get information about a collection
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            Collection information
        """
        try:
            info = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "count": info.points_count,
                "vector_size": info.config.params.vectors.size,
                "distance": str(info.config.params.vectors.distance)
            }
        except Exception as e:
            return {"error": str(e), "collection": collection_name}
    
    def list_collections(self) -> List[str]:
        """
        List all collections
        
        Returns:
            List of collection names
        """
        collections = self.client.get_collections().collections
        return [c.name for c in collections]
    
    def delete_collection(self, collection_name: str) -> Dict[str, Any]:
        """
        Delete a collection
        
        Args:
            collection_name: Name of the collection to delete
            
        Returns:
            Deletion result
        """
        self.client.delete_collection(collection_name)
        return {"deleted": True, "collection": collection_name}
    
    def reset_database(self) -> Dict[str, Any]:
        """
        Reset the entire database (delete all collections)
        
        Returns:
            Reset result
        """
        collections = self.list_collections()
        for collection in collections:
            self.delete_collection(collection)
        
        self._create_default_collections()
        return {"reset": True, "recreated_collections": self.list_collections()}


# Singleton instance
_vector_service: Optional[VectorService] = None


def get_vector_service() -> VectorService:
    """Get the Vector service singleton"""
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
        _vector_service.initialize()
    return _vector_service
