# FastAPI with Qdrant Vector Database

This FastAPI backend provides AI-powered features using **Qdrant** as the vector database for similarity search and embeddings storage.

## 📋 Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

## 🚀 Quick Start

### Step 1: Create Virtual Environment

```bash
# Navigate to the FastAPI directory
cd backend/FastAPI

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run the Server

```bash
# Option 1: Using Python directly
python main.py

# Option 2: Using uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 4: Access the API

- **API Documentation (Swagger)**: http://localhost:8001/docs
- **Alternative Docs (ReDoc)**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/api/health
- **Database Health**: http://localhost:8001/api/health/db

---

## 📊 Working with Qdrant (Vector Database)

### What is a Vector Database?

A vector database stores data as mathematical vectors (embeddings). This enables:

- **Semantic search**: Find similar content based on meaning, not just keywords
- **AI-powered recommendations**: Match freelancers to jobs based on skills
- **Proposal generation**: Find relevant past proposals for new job descriptions

### Why Qdrant?

- **Python 3.14+ compatible** - Works with the latest Python versions
- **In-memory mode** - No separate server required for development
- **Persistent storage** - Can save data to disk for production
- **Fast similarity search** - Optimized for high-performance queries

### Collections

The database comes with 4 pre-configured collections:

| Collection            | Purpose                               |
| --------------------- | ------------------------------------- |
| `proposals`           | Store proposal templates and examples |
| `job_descriptions`    | Store job descriptions for matching   |
| `freelancer_profiles` | Store freelancer profile embeddings   |
| `company_profiles`    | Store company profile embeddings      |

---

## 🔧 Using the Vector Database

### 1. Adding Documents

```powershell
$body = @{
    collection = "proposals"
    documents = @(
        "I am a web developer with 5 years of experience in React",
        "Expert Python developer specializing in machine learning"
    )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri "http://localhost:8001/api/vectors/documents" -Method POST -Body $body -ContentType "application/json"
```

### 2. Searching for Similar Documents

```powershell
$body = @{
    collection = "proposals"
    query_texts = @("Looking for a frontend developer")
    n_results = 3
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri "http://localhost:8001/api/vectors/query" -Method POST -Body $body -ContentType "application/json"
```

### 3. Getting Collection Info

```bash
curl "http://localhost:8001/api/vectors/collections/proposals"
```

---

## 📁 Project Structure

```
FastAPI/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
├── venv/                   # Python virtual environment
├── app/
│   ├── routers/
│   │   ├── health.py      # Health check endpoints
│   │   └── vectors.py     # Vector database endpoints
│   └── services/
│       └── vector_service.py  # Qdrant operations
└── README.md
```

---

## 📚 API Reference

| Endpoint                          | Method | Description         |
| --------------------------------- | ------ | ------------------- |
| `/api/health`                     | GET    | Health check        |
| `/api/health/db`                  | GET    | Database health     |
| `/api/vectors/collections`        | GET    | List collections    |
| `/api/vectors/collections/{name}` | GET    | Get collection info |
| `/api/vectors/collections/{name}` | POST   | Create collection   |
| `/api/vectors/collections/{name}` | DELETE | Delete collection   |
| `/api/vectors/documents`          | POST   | Add documents       |
| `/api/vectors/query`              | POST   | Query by text       |
| `/api/vectors/reset`              | POST   | Reset database      |
