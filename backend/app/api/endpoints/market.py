from fastapi import APIRouter, HTTPException
from app.services.news import news_service
from typing import Any

router = APIRouter()

@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str) -> Any:
    """
    Get sentiment score and recommendation for a specific ticker symbol.
    """
    # Fetch more news for better coverage
    news = news_service.fetch_latest_news(limit=100)
    
    # Improved matching: check symbol and common company name patterns
    symbol_upper = symbol.upper()
    relevant_news = []
    
    # Try direct keyword match
    for n in news:
        title_text = n["title"].upper()
        summary_text = n["summary"].upper()
        if symbol_upper in title_text or symbol_upper in summary_text:
            relevant_news.append(n)
            
    # If no match, try checking if the ticker is part of a word (e.g. AI, BTC)
    if not relevant_news and len(symbol_upper) <= 4:
        # Fallback to broader searching if the symbol is short
        relevant_news = [
            n for n in news 
            if any(word == symbol_upper for word in n["title"].upper().split())
            or any(word == symbol_upper for word in n["summary"].upper().split())
        ]
    
    if not relevant_news:
        return {
            "symbol": symbol_upper,
            "sentiment": "Neutral",
            "score": 0.5,
            "recommendation": "Hold",
            "article_count": 0,
            "reason": f"No recent mentions of '{symbol_upper}' found in global news feeds. Try searching for broader terms like 'AI', 'BTC', or 'FED'."
        }

    # Calculate average sentiment
    scores = {"Positive": 1.0, "Neutral": 0.5, "Negative": 0.0}
    total_score = sum(scores.get(n["sentiment"], 0.5) for n in relevant_news)
    avg_score = total_score / len(relevant_news)
    
    sentiment = "Neutral"
    recommendation = "Hold"
    if avg_score > 0.65:
        sentiment = "Positive"
        recommendation = "Buy"
    elif avg_score < 0.35:
        sentiment = "Negative"
        recommendation = "Sell"
        
    return {
        "symbol": symbol.upper(),
        "sentiment": sentiment,
        "score": round(avg_score, 2),
        "recommendation": recommendation,
        "article_count": len(relevant_news)
    }
