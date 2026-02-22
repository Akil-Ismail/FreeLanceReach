# FreelanceReach FastAPI Backend

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

5. Run the development server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

## Project Structure

```
fastapi/
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── app/
│   ├── api/            # API endpoints
│   ├── models/         # Database models
│   ├── schemas/        # Pydantic schemas
│   └── services/       # Business logic
└── README.md
```
