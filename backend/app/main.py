import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.core.config import settings
from app.db.session import init_db

logger = logging.getLogger(__name__)

# Background task handle
_news_refresh_task = None


async def _periodic_news_refresh(interval_seconds: int = 300):
    """Background task to keep the news cache warm. Runs every 5 minutes."""
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            from app.services.news import news_service
            articles = await news_service.fetch_latest_news_async(min_relevance=0.15)
            logger.info("Background news refresh: %d articles cached", len(articles))

            # Also re-ingest into RAG store
            from app.services.rag import rag_service
            count = rag_service.ingest_news_from_service()
            logger.info("Background RAG re-ingest: %d documents", count)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning("Background news refresh error (non-fatal): %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    global _news_refresh_task

    # Initialize database tables
    await init_db()

    # Seed demo user with rich portfolio (idempotent)
    try:
        from app.db.init_data import seed_demo_user
        await seed_demo_user()
    except Exception as e:
        logger.warning("Demo user seed failed (non-fatal): %s", e)

    # Auto-ingest news into RAG store on startup
    try:
        from app.services.rag import rag_service
        count = rag_service.ingest_news_from_service()
        logger.info("Startup RAG ingest: %d documents", count)
    except Exception as e:
        logger.warning("Startup RAG ingest failed (non-fatal): %s", e)

    # Pre-warm news cache in background (non-blocking startup)
    try:
        from app.services.news import news_service
        asyncio.create_task(news_service.fetch_latest_news_async(min_relevance=0.15))
        logger.info("Startup news cache warm-up scheduled")
    except Exception as e:
        logger.warning("Startup news warm-up failed (non-fatal): %s", e)

    # Start periodic background refresh
    _news_refresh_task = asyncio.create_task(_periodic_news_refresh())

    yield

    # Shutdown: cancel background task
    if _news_refresh_task:
        _news_refresh_task.cancel()
        try:
            await _news_refresh_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/")
def root():
    return {"message": "Welcome to AutoTraderX API"}


@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "healthy"}


app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
