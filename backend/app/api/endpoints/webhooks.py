from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from app.services.rag import rag_service

router = APIRouter()

@router.post("/ingest-news")
async def ingest_news_webhook(
    news_batch: List[Dict[str, Any]] = Body(..., description="List of news items from n8n")
):
    """
    Webhook to ingest news from n8n.
    Expected format per item:
    {
        "content": "Full text of the article...",
        "metadata": {
            "title": "Article Title",
            "url": "https://...",
            "source": "Reuters",
            "published_at": "2023-..."
        }
    }
    """
    try:
        if not news_batch:
            return {"status": "ignored", "message": "Empty batch"}
            
        rag_service.ingest(news_batch)
        return {"status": "success", "ingested_count": len(news_batch)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_rag(
    query: str = Body(..., embed=True),
    k: int = Body(5, embed=True)
):
    """
    Test endpoint to query the RAG system
    """
    results = rag_service.retrieve(query, k=k)
    return {"results": results}
