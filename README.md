# 🚀 AutoTraderX — AI-Powered Investment Platform

> Full-stack investment intelligence platform powered by Llama 3 (via Groq), real-time market data, and modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## 📁 Project Structure

```
AutoTraderX/
├── backend/                 # FastAPI REST API
│   ├── app/
│   │   ├── api/             # Route handlers (auth, users, market, news, advisor)
│   │   ├── core/            # Config, security, LLM client
│   │   ├── db/              # Database session & seeders
│   │   ├── models/          # SQLModel schemas
│   │   └── services/        # Business logic (market data, news, AI advisor)
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Next.js 16 + Tailwind + Shadcn UI
│   ├── app/
│   │   ├── dashboard/       # Dashboard, Market, Portfolio, News, AI Advisor
│   │   ├── login/           # Authentication pages
│   │   └── signup/
│   ├── components/          # Reusable UI components (Charts, Sidebar, Navbar)
│   ├── lib/                 # API client, utilities
│   ├── Dockerfile
│   └── package.json
├── k8s/                     # Kubernetes manifests
├── docs/                    # AWS deployment guide
├── docker-compose.yml       # Local dev services (Postgres, Neo4j, Adminer)
└── README.md
```

---

## ✅ Prerequisites

- **Node.js** 20+
- **Python** 3.12+
- **Docker Desktop** (for PostgreSQL & Neo4j)
- **Groq API Key** — [Get one free](https://console.groq.com/)

---

## 🏃 Quick Start

### 1. Clone & Enter

```bash
git clone https://github.com/your-username/AutoTraderX.git
cd AutoTraderX
```

### 2. Start Database Services

```bash
docker compose up -d
```

This starts:
| Service   | Port  | Description               |
|-----------|-------|---------------------------|
| Postgres  | 5432  | Primary database          |
| Neo4j     | 7474  | Graph database (browser)  |
| Neo4j     | 7687  | Graph database (bolt)     |
| Adminer   | 9090  | Database admin UI         |

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate     # macOS/Linux
# .venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env          # Edit .env with your keys (see below)

# Run database migrations
alembic upgrade head

# (Optional) Seed sample users
python -m app.db.init_data

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 5. Open the App

| URL                        | Description          |
|---------------------------|----------------------|
| http://localhost:3000      | Frontend (Next.js)   |
| http://localhost:8000/docs | API Docs (Swagger)   |
| http://localhost:9090      | Adminer (DB Admin)   |

---

## 🔑 Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/autotraderx
SECRET_KEY=your-super-secret-jwt-key-change-me
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> **Note:** If you don't set `GROQ_API_KEY`, the app will still start — only the AI Advisor chat will be unavailable.

---

## 🧩 Features

### 📊 Dashboard
- Portfolio performance chart (YTD area chart)
- KPI cards: Total Balance, Active Positions, P&L, Win Rate
- Recent activity feed

### 📈 Market
- Real-time stock & crypto charts (AAPL, BTC, NVDA, ETH)
- Watchlist with 8 tracked assets
- Price change indicators

### 💼 Portfolio
- Donut allocation chart
- Holdings table with per-asset P&L
- Summary cards (Total Value, Total P&L, Asset Count)

### 📰 News
- Aggregated financial news from RSS feeds
- Color-coded category badges (Macro, Crypto, Tech, Commodities)
- Live update indicator

### 🤖 AI Financial Advisor
- Chat with Llama 3 (70B) via Groq
- Context-aware financial analysis
- Risk disclaimers included

### 🔐 Authentication
- JWT-based login/signup
- Bcrypt password hashing
- Protected API routes

---

## 🛠️ API Endpoints

| Method | Endpoint                    | Description              | Auth |
|--------|-----------------------------|--------------------------|------|
| POST   | `/api/v1/auth/login`        | Login (get JWT token)    | No   |
| POST   | `/api/v1/auth/signup`       | Register new user        | No   |
| GET    | `/api/v1/users/me`          | Get current user profile | Yes  |
| GET    | `/api/v1/market/stock/{ticker}` | Get stock price      | No   |
| GET    | `/api/v1/market/crypto/{symbol}`| Get crypto price     | No   |
| GET    | `/api/v1/news/latest`       | Get latest news          | No   |
| POST   | `/api/v1/advisor/chat`      | Chat with AI advisor     | Yes  |
| GET    | `/api/v1/health`            | Health check             | No   |

---

## 🐳 Docker (Production)

Build and run both services:

```bash
# Backend
cd backend && docker build -t autotraderx-backend .
docker run -p 8000:8000 --env-file .env autotraderx-backend

# Frontend
cd frontend && docker build -t autotraderx-frontend .
docker run -p 3000:3000 autotraderx-frontend
```

---

## ☸️ Kubernetes Deployment

```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

For full AWS EKS deployment, see [`docs/AWS_DEPLOYMENT.md`](docs/AWS_DEPLOYMENT.md).

---

## 🧪 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 16, Tailwind CSS, Shadcn UI, Recharts |
| Backend    | FastAPI, SQLModel, Alembic          |
| Database   | PostgreSQL 15, Neo4j 5              |
| AI         | Llama 3 70B via Groq (LangChain)   |
| Auth       | JWT (python-jose) + Bcrypt          |
| Data       | yfinance, ccxt, feedparser          |
| DevOps     | Docker, Kubernetes, AWS EKS         |

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
