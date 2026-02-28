"""
ChromaDB Vector Database Service

This service handles all vector database operations including:
- Storing embeddings
- Similarity search
- Collection management
"""

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import os


class ChromaService:
    """Service class for ChromaDB operations"""
    
    def __init__(self, persist_directory: str = None):
        """
        Initialize ChromaDB service
        
        Args:
            persist_directory: Directory to persist the database
        """
        self.persist_directory = persist_directory or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "chroma_data"
        )
        self.client = None
        self.collections: Dict[str, Any] = {}
    
    def initialize(self):
        """Initialize the ChromaDB client with persistence"""
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Create default collections
        self._create_default_collections()
    
    def _create_default_collections(self):
        """Create default collections for the application"""
        default_collections = [
            "proposals",        # Store proposal templates and examples
            "job_descriptions", # Store job descriptions for matching
            "freelancer_profiles", # Store freelancer profile embeddings
            "company_profiles"  # Store company profile embeddings
        ]
        
        for collection_name in default_collections:
            self.get_or_create_collection(collection_name)
    
    def get_or_create_collection(self, name: str) -> Any:
        """
        Get or create a collection
        
        Args:
            name: Collection name
            
        Returns:
            ChromaDB collection
        """
        if name not in self.collections:
            self.collections[name] = self.client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
        return self.collections[name]
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Add documents to a collection (ChromaDB will auto-embed)
        
        Args:
            collection_name: Name of the collection
            documents: List of text documents
            metadatas: Optional list of metadata dicts
            ids: Optional list of IDs (auto-generated if not provided)
            
        Returns:
            Response with added IDs
        """
        collection = self.get_or_create_collection(collection_name)
        
        # Generate IDs if not provided
        if ids is None:
            existing_count = collection.count()
            ids = [f"{collection_name}_{existing_count + i}" for i in range(len(documents))]
        
        # Add documents
        collection.add(
            documents=documents,
            metadatas=metadatas or [{}] * len(documents),
            ids=ids
        )
        
        return {"added_ids": ids, "collection": collection_name}
    
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
        collection = self.get_or_create_collection(collection_name)
        
        if ids is None:
            existing_count = collection.count()
            ids = [f"{collection_name}_{existing_count + i}" for i in range(len(embeddings))]
        
        collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas or [{}] * len(embeddings),
            ids=ids
        )
        
        return {"added_ids": ids, "collection": collection_name}
    
    def query(
        self,
        collection_name: str,
        query_texts: List[str],
        n_results: int = 5,
        where: Optional[Dict] = None,
        include: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Query collection using text (auto-embedded)
        
        Args:
            collection_name: Name of the collection
            query_texts: List of query texts
            n_results: Number of results to return
            where: Optional filter conditions
            include: What to include in results
            
        Returns:
            Query results
        """
        collection = self.get_or_create_collection(collection_name)
        
        results = collection.query(
            query_texts=query_texts,
            n_results=n_results,
            where=where,
            include=include or ["documents", "metadatas", "distances"]
        )
        
        return results
    
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
        collection = self.get_or_create_collection(collection_name)
        
        results = collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"]
        )
        
        return results
    
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
        collection = self.get_or_create_collection(collection_name)
        
        if ids:
            collection.delete(ids=ids)
        elif where:
            collection.delete(where=where)
        
        return {"deleted": True, "collection": collection_name}
    
    def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """
        Get information about a collection
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            Collection information
        """
        collection = self.get_or_create_collection(collection_name)
        
        return {
            "name": collection_name,
            "count": collection.count(),
            "metadata": collection.metadata
        }
    
    def list_collections(self) -> List[str]:
        """
        List all collections
        
        Returns:
            List of collection names
        """
        collections = self.client.list_collections()
        return [col.name for col in collections]
    
    def delete_collection(self, collection_name: str) -> Dict[str, Any]:
        """
        Delete a collection
        
        Args:
            collection_name: Name of the collection to delete
            
        Returns:
            Deletion result
        """
        self.client.delete_collection(collection_name)
        if collection_name in self.collections:
            del self.collections[collection_name]
        
        return {"deleted": True, "collection": collection_name}
    
    def reset_database(self) -> Dict[str, Any]:
        """
        Reset the entire database (delete all collections)
        
        Returns:
            Reset result
        """
        self.client.reset()
        self.collections = {}
        self._create_default_collections()
        
        return {"reset": True}


# Singleton instance
_chroma_service: Optional[ChromaService] = None


def get_chroma_service() -> ChromaService:
    """Get the ChromaDB service singleton"""
    global _chroma_service
    if _chroma_service is None:
        _chroma_service = ChromaService()
        _chroma_service.initialize()
    return _chroma_service
