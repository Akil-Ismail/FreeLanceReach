<div align="center">

<img src="frontend/public/logo1.png" alt="Freelance Reach Logo" width="480"/>

<br/>
<br/>

**The AI-Powered Freelance Platform that connects talent with opportunity**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel](https://img.shields.io/badge/Laravel-8.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)

<br/>

[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC143C?style=flat-square)](https://qdrant.tech/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Powered-orange?style=flat-square)](https://groq.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com/)
[![Google OAuth](https://img.shields.io/badge/Google-OAuth_2.0-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/identity)

<br/>

[Features](#-features) · [Screenshots](#-screenshots) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Docs](#-api-reference)

</div>

---

## Overview

**Freelance Reach** is a full-stack, AI-powered freelance platform that streamlines the entire freelancing lifecycle — from discovering the right talent to signing contracts and delivering work. The platform uses state-of-the-art AI to intelligently match companies with freelancers, auto-generate tailored proposals, and provide conversational AI assistants for both sides of the marketplace.

Built as a graduate thesis project at the Lebanese International University, Freelance Reach demonstrates modern software architecture combining a Next.js frontend, a Laravel REST API, and a FastAPI AI service layer backed by vector embeddings.

---

## Features

### For Companies
- **Smart Freelancer Matching** — BERT-powered semantic matching ranks freelancers by relevance to your job description
- **AI Job Proposals** — Generate and manage job proposals with AI-assisted content
- **Contract Management** — Create, send, and e-sign contracts within the platform
- **Task Board** — Assign and track deliverables once a contract is active
- **Meeting Scheduler** — Request and manage meetings with freelancers
- **AI Assistant** — Conversational chatbot with full context of your pipeline
- **Real-time Notifications** — Stay updated on proposals, approvals, and messages
- **Approval Workflows** — Structured approval flow for meetings and contracts

### For Freelancers
- **AI Proposal Generator** — One-click AI-generated proposals tailored to job requirements
- **Job Discovery** — Browse and filter available jobs matched to your profile
- **Smart Matching Score** — See how well you match each company's needs
- **Contract Signing** — Digitally sign contracts and start working immediately
- **Task Management** — View and update tasks assigned after contract activation
- **Meeting Management** — Accept, decline, or reschedule meeting requests
- **AI Assistant** — Personal chatbot aware of your profile and active jobs
- **Profile Builder** — AI-enhanced profile setup with skills and bio optimization

### Platform-wide
- **Role-based Access Control** — Separate dashboards and permissions for companies and freelancers
- **Google OAuth** — Sign in with Google for both user types
- **Responsive Design** — Mobile-first UI that works on any screen size
- **Vector Search** — Semantic search across profiles and proposals using Qdrant

---

## Screenshots

### Landing & Authentication

<table>
  <tr>
    <td align="center">
      <img src="images/before%20signing%20in/landing.png" alt="Landing Page" width="100%"/>
      <br/><sub><b>Landing Page</b></sub>
    </td>
    <td align="center">
      <img src="images/before%20signing%20in/features.png" alt="Features Page" width="100%"/>
      <br/><sub><b>Features Showcase</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/before%20signing%20in/login.png" alt="Login" width="100%"/>
      <br/><sub><b>Login</b></sub>
    </td>
    <td align="center">
      <img src="images/before%20signing%20in/signin%20as%20a%20company.png" alt="Company Sign Up" width="100%"/>
      <br/><sub><b>Company Registration</b></sub>
    </td>
  </tr>
</table>

---

### Company Dashboard

<table>
  <tr>
    <td align="center">
      <img src="images/company/home%20company.png" alt="Company Home" width="100%"/>
      <br/><sub><b>Company Home</b></sub>
    </td>
    <td align="center">
      <img src="images/company/Matching%20Company.png" alt="AI Matching" width="100%"/>
      <br/><sub><b>AI Freelancer Matching</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/company/Job%20Proposals%20company.png" alt="Job Proposals" width="100%"/>
      <br/><sub><b>Job Proposals</b></sub>
    </td>
    <td align="center">
      <img src="images/company/new%20job%20proposal%20company.png" alt="New Proposal" width="100%"/>
      <br/><sub><b>Create New Proposal</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/company/Contracts%20Company.png" alt="Contracts" width="100%"/>
      <br/><sub><b>Contract Management</b></sub>
    </td>
    <td align="center">
      <img src="images/company/tasks%20Company.png" alt="Tasks" width="100%"/>
      <br/><sub><b>Task Board</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/company/Ai%20assistant%20Company.png" alt="AI Assistant" width="100%"/>
      <br/><sub><b>AI Assistant</b></sub>
    </td>
    <td align="center">
      <img src="images/company/Meeting%20Company.png" alt="Meetings" width="100%"/>
      <br/><sub><b>Meeting Scheduler</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/company/Notifications%20Company.png" alt="Notifications" width="100%"/>
      <br/><sub><b>Notifications</b></sub>
    </td>
    <td align="center">
      <img src="images/company/Approvals%20Company.png" alt="Approvals" width="100%"/>
      <br/><sub><b>Approvals Workflow</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/company/freelancer%20profile%20card.png" alt="Freelancer Card" width="100%"/>
      <br/><sub><b>Freelancer Profile Card</b></sub>
    </td>
    <td align="center">
      <img src="images/company/profile%20company.png" alt="Company Profile" width="100%"/>
      <br/><sub><b>Company Profile</b></sub>
    </td>
  </tr>
</table>

---

### Freelancer Dashboard

<table>
  <tr>
    <td align="center">
      <img src="images/freelancer/freelancer%20home.png" alt="Freelancer Home" width="100%"/>
      <br/><sub><b>Freelancer Home</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/dreelancer%20matching%20page.png" alt="Matching" width="100%"/>
      <br/><sub><b>Job Matching Page</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/freelancer/freelancer%20jobs%20page.png" alt="Jobs" width="100%"/>
      <br/><sub><b>Jobs Board</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/freelancer%20AI%20assistant.png" alt="AI Assistant" width="100%"/>
      <br/><sub><b>AI Assistant</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/freelancer/contract%20freelancer.png" alt="Contract" width="100%"/>
      <br/><sub><b>Contract Review</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/sign%20contract%20freelancer.png" alt="Sign Contract" width="100%"/>
      <br/><sub><b>Contract Signing</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/freelancer/tasks%20freelancer.png" alt="Tasks" width="100%"/>
      <br/><sub><b>Task Management</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/Tasks%20appear%20when%20mutually%20signed.png" alt="Active Tasks" width="100%"/>
      <br/><sub><b>Active Tasks (Post-Signing)</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/freelancer/freelancer%20meeting%20page.png" alt="Meetings" width="100%"/>
      <br/><sub><b>Meeting Requests</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/After%20approval%20of%20meeting%20freelancer.png" alt="After Approval" width="100%"/>
      <br/><sub><b>Approved Meeting</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/freelancer/freelancer%20approvals%20page.png" alt="Approvals" width="100%"/>
      <br/><sub><b>Approvals</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/freelancer%20notification%20page.png" alt="Notifications" width="100%"/>
      <br/><sub><b>Notifications</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/freelancer/freelancer%20profile.png" alt="Profile" width="100%"/>
      <br/><sub><b>Freelancer Profile</b></sub>
    </td>
    <td align="center">
      <img src="images/freelancer/company%20card.png" alt="Company Card" width="100%"/>
      <br/><sub><b>Company Card View</b></sub>
    </td>
  </tr>
</table>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FREELANCE REACH                          │
└─────────────────────────────────────────────────────────────────┘

          ┌──────────────────────────────────────┐
          │     Frontend  ·  Next.js 15 + React  │
          │         localhost:3000               │
          │  ┌──────────┐  ┌────────────────┐   │
          │  │ Company  │  │  Freelancer    │   │
          │  │Dashboard │  │  Dashboard     │   │
          │  └──────────┘  └────────────────┘   │
          └──────────┬─────────────┬────────────┘
                     │             │
           ┌─────────┘             └──────────┐
           ▼                                  ▼
┌──────────────────────┐          ┌───────────────────────┐
│  Laravel REST API    │          │  FastAPI  AI Service  │
│   localhost:8000     │          │    localhost:8001      │
│                      │          │                        │
│  • User Management   │          │  • BERT Matching       │
│  • Authentication    │          │  • Proposal Generator  │
│  • Contracts         │          │  • AI Chatbot (Groq)   │
│  • Tasks & Meetings  │          │  • Vector Search       │
│  • Notifications     │          │  • Evaluation Engine   │
└──────────┬───────────┘          └──────────┬────────────┘
           │                                  │
           ▼                                  ▼
   ┌───────────────┐                ┌─────────────────────┐
   │     MySQL     │                │    Qdrant Vector DB  │
   │  freelance_   │                │  (Embeddings Store)  │
   │    reach      │                │                      │
   └───────────────┘                └─────────────────────┘
```

### Service Communication

| Service | URL | Purpose |
|---|---|---|
| Frontend | `http://localhost:3000` | Next.js UI |
| Laravel API | `http://localhost:8000` | User, contracts, tasks |
| FastAPI AI | `http://localhost:8001` | Matching, proposals, chat |
| MySQL | `localhost:3306` | Relational data |
| Qdrant | `localhost:6333` | Vector embeddings |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.5.2 | React framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | 5.0 | Type safety |
| Tailwind CSS | v4 | Utility-first styling |
| Radix UI | Latest | Accessible component primitives |
| Lucide React | 0.542 | Icon library |
| Axios | 1.13 | HTTP client |
| Google OAuth | 0.13 | Social authentication |

### Backend — Laravel
| Technology | Version | Purpose |
|---|---|---|
| Laravel | 8.0 | PHP REST API framework |
| PHP | 8.0+ | Server-side language |
| MySQL | 8.0 | Primary relational database |
| XAMPP | Latest | Local dev server (Apache + MySQL) |
| Laravel CORS | Latest | Cross-origin resource sharing |

### Backend — FastAPI (AI Service)
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.109+ | High-performance Python API |
| Python | 3.11+ | AI/ML processing language |
| Sentence Transformers | 2.3+ | BERT-based semantic embeddings |
| Qdrant | 1.17+ | Vector database for similarity search |
| Groq AI | 1.4+ | LLM-powered chat and proposals |
| Pydantic | 2.6+ | Data validation |
| Uvicorn | 0.27+ | ASGI server |

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) 18.0+
- [PHP](https://php.net/) 8.0+
- [Composer](https://getcomposer.org/)
- [Python](https://python.org/) 3.11+
- [XAMPP](https://www.apachefriends.org/) (for MySQL)
- [Qdrant](https://qdrant.tech/documentation/guides/installation/) (Docker recommended)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/freelance-reach.git
cd freelance-reach
```

---

### 2. Database Setup

1. Start XAMPP and run **MySQL**
2. Open `http://localhost/phpmyadmin`
3. Create a new database named `freelance_reach`

---

### 3. Laravel Backend

```bash
cd backend/laravel/my-laravel-app

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# (Optional) Seed with test data
php artisan db:seed

# Start the Laravel server
php artisan serve
```

The Laravel API will be available at `http://localhost:8000`

**Test Credentials (after seeding):**

| Role | Email | Password |
|---|---|---|
| Company | company@test.com | password123 |
| Freelancer | freelancer@test.com | password123 |

---

### 4. FastAPI AI Service

```bash
cd backend/FastAPI

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The AI service will be available at `http://localhost:8001`

**Qdrant (Vector Database) — Docker:**
```bash
docker pull qdrant/qdrant
docker run -p 6333:6333 qdrant/qdrant
```

---

### 5. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Google OAuth client ID

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

### Environment Variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**FastAPI** (`backend/FastAPI/.env`):
```env
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8001
GROQ_API_KEY=your_groq_api_key_here
LARAVEL_URL=http://127.0.0.1:8000/api
```

**Laravel** (`backend/laravel/my-laravel-app/.env`):
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=freelance_reach
DB_USERNAME=root
DB_PASSWORD=
```

---

## API Reference

### Laravel REST API (`http://localhost:8000/api`)

#### User Management
```
POST   /api/register/company       Register a company account
POST   /api/register/freelancer    Register a freelancer account
GET    /api/users                  List all users
GET    /api/users/{id}             Get a single user
GET    /api/users/role/{role}      Filter by role (company | freelancer)
PUT    /api/users/{id}             Update user profile
DELETE /api/users/{id}             Delete user
```

#### Platform Operations
```
GET/POST  /api/contracts           Contract management
GET/POST  /api/tasks               Task board operations
GET/POST  /api/meetings            Meeting scheduling
GET/POST  /api/notifications       User notifications
GET/POST  /api/approvals           Approval workflows
GET/POST  /api/chat                Chat messages
```

---

### FastAPI AI Service (`http://localhost:8001/api`)

#### Health
```
GET  /api/health      Service health check
GET  /api/health/db   Qdrant database health
```

#### Matching
```
POST  /api/matching/match-freelancers   Match freelancers to a job description
POST  /api/matching/match-jobs          Match jobs to a freelancer profile
```

#### Proposal Generator
```
POST  /api/proposal-generator/generate    Generate AI proposal
POST  /api/proposal-generator/cache       Cache a proposal
GET   /api/proposal-generator/cached      Retrieve cached proposals
```

#### AI Chat
```
POST  /api/company-chat/message       Company AI assistant
POST  /api/freelancer-chat/message    Freelancer AI assistant
```

#### Vector Operations
```
GET   /api/vectors/collections       List vector collections
POST  /api/vectors/documents         Store a document embedding
POST  /api/vectors/query             Semantic similarity search
POST  /api/vectors/reset             Reset vector database
```

#### Evaluation
```
POST  /api/evaluation/evaluate       Evaluate matching performance
GET   /api/evaluation/metrics        Retrieve evaluation metrics
```

---

## Project Structure

```
freelance-reach/
│
├── frontend/                    # Next.js 15 Application
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── home/            # Authenticated dashboard routes
│   │   │   │   ├── matching/    # AI matching page
│   │   │   │   ├── contracts/   # Contract management
│   │   │   │   ├── tasks/       # Task board
│   │   │   │   ├── meetings/    # Meeting scheduler
│   │   │   │   ├── chatbot/     # AI assistant
│   │   │   │   ├── notifications/
│   │   │   │   ├── approvals/
│   │   │   │   └── profile/
│   │   │   ├── login/           # Authentication
│   │   │   ├── signup/          # Registration (company + freelancer)
│   │   │   └── ai-proposal-generator/
│   │   ├── components/          # Reusable React components
│   │   ├── hooks/               # Custom React hooks (useAuth, useToast)
│   │   └── lib/                 # Utilities
│   └── public/                  # Static assets (logo, images)
│
├── backend/
│   ├── FastAPI/                 # Python AI Service
│   │   ├── app/
│   │   │   ├── routers/         # Route handlers
│   │   │   ├── services/        # Business logic
│   │   │   │   ├── bert_matching_service.py
│   │   │   │   ├── vector_service.py
│   │   │   │   └── gemini_service.py
│   │   │   └── models/          # Pydantic schemas
│   │   ├── main.py              # FastAPI entry point
│   │   └── requirements.txt
│   │
│   └── laravel/
│       └── my-laravel-app/      # Laravel REST API
│           ├── app/
│           │   ├── Http/Controllers/
│           │   ├── Models/
│           │   └── Http/Requests/
│           ├── database/
│           │   ├── migrations/
│           │   └── seeders/
│           ├── routes/api.php
│           ├── API_DOCUMENTATION.md
│           └── QUICK_START.md
│
└── images/                      # Project screenshots
    ├── before signing in/
    ├── company/
    └── freelancer/
```

---

## Running Tests

### Laravel
```bash
cd backend/laravel/my-laravel-app
php artisan test
```

The test suite covers:
- Company registration
- Freelancer registration
- User listing and filtering
- User update and deletion
- Role-based queries

### FastAPI
```bash
cd backend/FastAPI
pytest
```

---

## Key AI Features Deep Dive

### BERT Semantic Matching

The matching engine uses `sentence-transformers` to generate semantic embeddings of both freelancer profiles and job descriptions. These embeddings are stored in **Qdrant** and queried using cosine similarity to return ranked matches.

```
Job Description → BERT Embedding → Qdrant Query → Top-N Freelancers
Freelancer Profile → BERT Embedding → Qdrant Query → Matching Jobs
```

### Groq-Powered Chat

Both the company and freelancer AI assistants use **Groq's ultra-fast inference** with a contextual system prompt built from the user's profile, active contracts, and platform state. Chat history is persisted across sessions.

### AI Proposal Generator

Given a job description, the proposal generator uses Groq to produce a tailored, professional proposal. Generated proposals are cached in Qdrant so they can be reused and scored for similarity against past successful proposals.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## Authors

**Akil Ismail** — Full-Stack Developer & AI Integration  
Lebanese International University · Graduate Thesis Project

---

<div align="center">

<img src="frontend/public/logo1.png" alt="Freelance Reach" width="200"/>

<br/>

*Built with passion, powered by AI.*

</div>
