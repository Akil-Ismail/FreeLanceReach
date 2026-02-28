"""
FastAPI Application with Qdrant Vector Database Integration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.routers import vectors, health, company_chat, freelancer_chat
from app.services.vector_service import VectorService
from app.services.gemini_service import get_gemini_service

# Initialize Vector DB service
vector_service = VectorService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Initialize Vector DB
    print("🚀 Starting FastAPI server...")
    print("📊 Initializing Qdrant vector database...")
    vector_service.initialize()
    print("✅ Vector database initialized successfully!")
    
    # Initialize Gemini AI
    print("🤖 Initializing Gemini AI service...")
    gemini_service = get_gemini_service()
    gemini_service.initialize()
    
    yield
    
    # Shutdown
    print("👋 Shutting down FastAPI server...")


app = FastAPI(
    title="Freelance Reach AI API",
    description="FastAPI backend with Qdrant vector database for AI-powered proposal generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(vectors.router, prefix="/api/vectors", tags=["Vectors"])
app.include_router(company_chat.router, prefix="/api/company-chat", tags=["Company Chat"])
app.include_router(freelancer_chat.router, prefix="/api/freelancer-chat", tags=["Freelancer Chat"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Freelance Reach AI API",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
