# 🚀 AutoTraderX — AI-Powered Investment Platform

> Full-stack investment intelligence platform powered by Llama 3 (via Groq), real-time market data, and modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## 📁 Project Structure

```
AutoTraderX/
├── backend/                 # FastAPI REST API
│   ├── app/
│   │   ├── api/             # Route handlers
│   │   ├── core/            # Config, security, LLM client
│   │   ├── db/              # Database session & seeders
│   │   ├── models/          # SQLModel schemas
│   │   └── services/        # Business logic (market data, news, AI advisor)
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Next.js 15 + Tailwind + Shadcn UI
│   ├── app/                 # App Router (Dashboard, Market, Portfolio)
│   ├── components/          # Reusable UI components
│   ├── lib/                 # API client, utilities
│   ├── Dockerfile
│   └── package.json
├── k8s/                     # Kubernetes manifests
├── docker-compose.yml       # Full stack deployment (Frontend + Backend + DB)
└── README.md
```

---

## ✅ Prerequisites

- **Docker Desktop** (Recommended for easiest deployment)
- OR
- **Node.js** 20+
- **Python** 3.12+
- **PostgreSQL** 15+

---

## 🏃 Quick Start (Docker)

The easiest way to run the full application is using Docker Compose.

### 1. Clone & Enter

```bash
git clone https://github.com/SWAYAM-132/AutoTrader.git
cd AutoTraderX
```

### 2. Configure Environment

Create `backend/.env` with your API keys:

```env
SECRET_KEY=change-this-to-a-secure-random-string
GROQ_API_KEY=gsk_your_groq_api_key_here
POSTGRES_PASSWORD=password
```

### 3. Start Application

```bash
docker-compose up -d --build
```

### 4. Access App

| Service   | URL                       | Description               |
|-----------|---------------------------|---------------------------|
| Frontend  | http://localhost:3000     | Main Web Application      |
| Backend   | http://localhost:8000/docs| API Documentation         |
| Adminer   | http://localhost:9090     | Database Management       |

---

## 🛠️ Manual Setup (Dev Mode)

If you prefer running services individually without Docker:

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Ensure you have a local PostgreSQL running
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🧩 Features

### 📊 Dashboard
- **Live Market Data**: Real-time ticker updates and heatmaps
- **AI Predictions**: Sentiment-driven market predictions
- **News Feed**: Aggregated financial news with AI summaries

### 📈 Market Analysis
- **Interactive Charts**: Historical price data for stocks and crypto
- **Live Watchlist**: Track your favorite assets
- **Sentiment Scoring**: Real-time bullish/bearish indicators

### 🤖 AI Financial Advisor
- **Chat Interface**: Context-aware queries about market trends
- **Llama 3 Powered**: Deep analysis using Groq inference
- **Portfolio Insights**: Personalized recommendations

### � Security
- **JWT Authentication**: Secure login/signup flow
- **CORS Protection**: Configured for secure cross-origin requests
- **Dependency Injection**: Robust backend architecture

---

## 🧪 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js, Tailwind CSS, Shadcn UI, Recharts |
| Backend    | FastAPI, SQLModel, Alembic          |
| Database   | PostgreSQL                          |
| AI         | Llama 3 70B via Groq (LangChain)    |
| Auth       | JWT (python-jose) + Bcrypt          |
| DevOps     | Docker, Kubernetes                  |

---

## 📜 License

MIT License.
