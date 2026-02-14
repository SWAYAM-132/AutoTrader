from typing import Any, List

from fastapi import APIRouter, Query

from app.services.news import news_service

router = APIRouter()


@router.get("/latest")
def get_latest_news(
    limit: int = Query(default=15, ge=1, le=50),
    min_relevance: float = Query(default=0.45, ge=0.0, le=1.0),
    only_actionable: bool = Query(default=True),
    source_types: List[str] = Query(default=[]),
) -> Any:
    """
    Get latest financial news from multiple channels.

    Supported source_types: market, social, blog.
    """
    return news_service.fetch_latest_news(
        limit=limit,
        min_relevance=min_relevance,
        only_actionable=only_actionable,
        source_types=source_types,
    )
