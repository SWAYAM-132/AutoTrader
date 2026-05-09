from typing import Any, List

from fastapi import APIRouter, Query

from app.services.news import news_service

router = APIRouter()


@router.get("/latest")
async def get_latest_news(
    min_relevance: float = Query(default=0.30, ge=0.0, le=1.0),
    only_actionable: bool = Query(default=False),
    source_types: List[str] = Query(default=[]),
) -> Any:
    """
    Get latest financial news from multiple channels.
    Uses async parallel RSS fetching for minimal latency.

    Supported source_types: market, social, blog.
    """
    return await news_service.fetch_latest_news_async(
        min_relevance=min_relevance,
        only_actionable=only_actionable,
        source_types=source_types,
    )
