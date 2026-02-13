import feedparser
import logging
from typing import List, Dict, Any
from datetime import datetime
import time

logger = logging.getLogger(__name__)

RSS_FEEDS = [
    "https://finance.yahoo.com/news/rssindex",
    "https://www.cnbc.com/id/10000664/device/rss/rss.html",
    "https://www.investing.com/rss/news_25.rss",
    "https://www.coindesk.com/arc/outboundfeeds/rss/"
]

class NewsService:
    def get_sentiment(self, text: str) -> str:
        """
        Simple keyword-based sentiment analysis for MVP.
        In production, use a dedicated model or LLM.
        """
        positive_words = [
            "bullish", "growth", "up", "gain", "profit", "surge", "higher", "positive",
            "dividend", "upgrade", "buy", "outperform", "partnership", "breakthrough"
        ]
        negative_words = [
            "bearish", "fall", "down", "loss", "drop", "lower", "negative", "crisis",
            "bankruptcy", "lawsuit", "downgrade", "sell", "underperform", "fraud", "debt"
        ]
        
        text_lower = text.lower()
        pos_score = sum(1 for word in positive_words if word in text_lower)
        neg_score = sum(1 for word in negative_words if word in text_lower)
        
        # Weighted scaling for more certainty
        if pos_score > neg_score * 1.2:
            return "Positive"
        elif neg_score > pos_score * 1.2:
            return "Negative"
        return "Neutral"

    def fetch_latest_news(self, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetch and aggregate news from multiple RSS feeds with sentiment.
        """
        all_articles = []
        
        for url in RSS_FEEDS:
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:8]: # Increase limit per feed
                    published_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
                    published_dt = datetime.fromtimestamp(time.mktime(published_parsed)) if published_parsed else datetime.now()
                    
                    summary = entry.get("summary", "")
                    sentiment = self.get_sentiment(entry.title + " " + summary)
                    
                    all_articles.append({
                        "title": entry.title,
                        "link": entry.link,
                        "summary": summary,
                        "source": feed.feed.get("title", "Unknown"),
                        "published_at": published_dt,
                        "sentiment": sentiment
                    })
            except Exception as e:
                logger.error(f"Error fetching RSS {url}: {e}")
        
        if not all_articles:
            logger.warning("No articles fetched from RSS feeds. Using fallback data.")
            # Fallback data for resilience
            all_articles = [
                {
                    "title": "Markets Await Fed Decision on Interest Rates",
                    "link": "https://finance.yahoo.com",
                    "summary": "Investors are closely watching the upcoming Federal Reserve meeting for signals on future rate cuts and economic outlook.",
                    "source": "Market Watch (Fallback)",
                    "published_at": datetime.now(),
                    "sentiment": "Neutral",
                    "category": "Macro"
                },
                {
                    "title": "Tech Stocks Rally on AI Breakthroughs",
                    "link": "https://www.cnbc.com",
                    "summary": "Major technology firms see significant gains as new developments in generative AI continue to drive investor optimism.",
                    "source": "TechCrunch (Fallback)",
                    "published_at": datetime.now(),
                    "sentiment": "Positive",
                    "category": "Tech"
                }
            ]
        
        # Sort by date descending
        all_articles.sort(key=lambda x: x["published_at"], reverse=True)
        
        return all_articles[:limit]

news_service = NewsService()
