# FreelanceReach

A modern, professional freelance platform built with Next.js 15, featuring a clean architecture and scalable structure.

## Project Structure

```
freelance-reach/
├── frontend/          # Next.js 15 frontend application
├── backend/
│   ├── fastapi/      # FastAPI Python backend
│   └── laravel/      # Laravel PHP backend
└── README.md
```

## Frontend (Next.js 15)

### Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Features

- Modern, responsive UI with Tailwind CSS
- User authentication (Login/Signup)
- Freelancer and Company registration
- CV/Resume upload for freelancers
- AI-powered client outreach

## Backend

### FastAPI (Python)

```bash
cd backend/fastapi
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`
Documentation at `http://localhost:8000/docs`

### Laravel (PHP)

```bash
cd backend/laravel
composer create-project laravel/laravel .
php artisan serve --port=8001
```

API available at `http://localhost:8001`

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), Laravel (PHP)
- **Database**: PostgreSQL (recommended)
- **Authentication**: JWT tokens

## Development

1. Start the frontend: `cd frontend && npm run dev`
2. Start FastAPI: `cd backend/fastapi && uvicorn main:app --reload`
3. Start Laravel: `cd backend/laravel && php artisan serve`

## License

Private
