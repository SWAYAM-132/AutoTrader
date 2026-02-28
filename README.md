# AutoTraderX

An AI-powered financial trading assistant with real-time market data, sentiment analysis, and an intelligent chatbot advisor.

## Architecture

```
AutoTraderX/
├── backend/               # FastAPI + PostgreSQL + ChromaDB
│   ├── app/
│   │   ├── api/           # REST endpoints (auth, market, news, advisor, db)
│   │   ├── core/          # Config, LLM, security, ticker mappings
│   │   ├── db/            # Database session & seed data
│   │   ├── models/        # SQLModel ORM models
│   │   └── services/      # Business logic (news, market, RAG, advisor)
│   ├── fine_tuning/       # QLoRA fine-tuning scripts (GPU required)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # Next.js 14 dashboard
│   ├── app/               # Pages (dashboard, login, signup)
│   ├── components/        # UI components (chat, portfolio, news, etc.)
│   ├── lib/               # API client
│   └── Dockerfile
├── docker-compose.yml     # Full stack orchestration
└── k8s/                   # Kubernetes deployment configs
```

## Quick Start (Docker)

```bash
# Clone and start all services
git clone <repo-url> && cd AutoTraderX

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your GROQ_API_KEY

# Build and start everything
docker compose up --build -d

# Check all services are running
docker compose ps
```

### Services

| Service    | URL                          | Description              |
|------------|------------------------------|--------------------------|
| Frontend   | http://localhost:3000         | Next.js dashboard        |
| Backend    | http://localhost:8000         | FastAPI REST API          |
| API Docs   | http://localhost:8000/docs    | Swagger UI               |
| Adminer    | http://localhost:9090         | Database admin panel      |
| ChromaDB   | http://localhost:8001         | Vector store (RAG)        |

### Key API Endpoints

| Endpoint                          | Method | Description                    |
|-----------------------------------|--------|--------------------------------|
| `/api/v1/health`                  | GET    | Health check                   |
| `/api/v1/auth/login`              | POST   | Login (OAuth2)                 |
| `/api/v1/auth/signup`             | POST   | User registration              |
| `/api/v1/market/sentiment/{sym}`  | GET    | Price + sentiment for ticker   |
| `/api/v1/news/latest`             | GET    | Latest financial news          |
| `/api/v1/advisor/chat`            | POST   | AI advisor chat (auth required)|
| `/api/v1/db/tables`              | GET    | List database tables           |
| `/api/v1/db/tables/{name}`        | GET    | View table data (paginated)    |
| `/api/v1/db/rag/stats`           | GET    | RAG vector store statistics    |

## Features

- **AI Financial Advisor** — Chat-based advisor powered by LLaMA 3 via Groq
- **RAG Knowledge Base** — ChromaDB vector store with sentence-transformers embeddings
- **Real-time Market Data** — Prices from Yahoo Finance & CoinGecko
- **News Aggregation** — RSS feeds from 13+ financial news sources with sentiment analysis
- **Portfolio Management** — Track holdings with real-time P&L
- **QLoRA Fine-Tuning** — Scripts to fine-tune LLMs on financial advisory data

## Fine-Tuning (QLoRA)

See [backend/fine_tuning/README.md](backend/fine_tuning/README.md) for instructions on fine-tuning the LLM using QLoRA with GPU.

## Development

```bash
# Backend (local development)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (local development)
cd frontend
npm install
npm run dev
```

## Deployment

See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) for AWS deployment instructions.
