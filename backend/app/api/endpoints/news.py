from typing import Any, List
from fastapi import APIRouter
from app.api import deps
from app.services.news import news_service

router = APIRouter()

@router.get("/latest")
def get_latest_news(limit: int = 10) -> Any:
    """
    Get latest financial news from RSS feeds.
    """
    return news_service.fetch_latest_news(limit=limit)
