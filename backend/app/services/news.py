import logging
import re
import time
from datetime import datetime
from typing import Any, Dict, List, TypedDict

import feedparser

logger = logging.getLogger(__name__)


class FeedSource(TypedDict):
    label: str
    url: str
    source_type: str
    trust: float


NEWS_SOURCES: List[FeedSource] = [
    {"label": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex", "source_type": "market", "trust": 0.82},
    {"label": "CNBC", "url": "https://www.cnbc.com/id/10000664/device/rss/rss.html", "source_type": "market", "trust": 0.90},
    {"label": "Reuters Business", "url": "https://feeds.reuters.com/reuters/businessNews", "source_type": "market", "trust": 0.93},
    {"label": "Investing.com", "url": "https://www.investing.com/rss/news_25.rss", "source_type": "market", "trust": 0.80},
    {"label": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "source_type": "market", "trust": 0.75},
    {"label": "Reddit r/stocks", "url": "https://www.reddit.com/r/stocks/.rss", "source_type": "social", "trust": 0.58},
    {"label": "Reddit r/investing", "url": "https://www.reddit.com/r/investing/.rss", "source_type": "social", "trust": 0.6},
    {"label": "Reddit r/wallstreetbets", "url": "https://www.reddit.com/r/wallstreetbets/.rss", "source_type": "social", "trust": 0.42},
    {"label": "Seeking Alpha", "url": "https://seekingalpha.com/feed.xml", "source_type": "blog", "trust": 0.72},
    {"label": "Calculated Risk", "url": "https://www.calculatedriskblog.com/feeds/posts/default", "source_type": "blog", "trust": 0.74},
    {"label": "X Markets (RSS mirror)", "url": "https://rsshub.app/twitter/user/markets", "source_type": "social", "trust": 0.5},
]

MARKET_RELEVANCE_KEYWORDS = {
    "earnings": 0.16,
    "guidance": 0.12,
    "revenue": 0.12,
    "profit": 0.12,
    "inflation": 0.14,
    "interest rate": 0.15,
    "federal reserve": 0.15,
    "fed": 0.14,
    "analyst": 0.1,
    "upgrade": 0.12,
    "downgrade": 0.12,
    "merger": 0.14,
    "acquisition": 0.14,
    "sec": 0.1,
    "lawsuit": 0.09,
    "bankruptcy": 0.14,
    "tariff": 0.1,
    "oil": 0.08,
    "crypto": 0.08,
    "etf": 0.1,
}

NOISE_KEYWORDS = {
    "lifestyle",
    "celebrity",
    "sports",
    "recipe",
    "travel",
    "sponsored",
}


class NewsService:
    def _normalize(self, text: str) -> str:
        return re.sub(r"\s+", " ", text.lower()).strip()

    def get_relevance_score(self, title: str, summary: str, source_trust: float) -> float:
        combined = self._normalize(f"{title} {summary}")

        relevance = 0.16
        for keyword, weight in MARKET_RELEVANCE_KEYWORDS.items():
            if keyword in combined:
                relevance += weight

        for noisy in NOISE_KEYWORDS:
            if noisy in combined:
                relevance -= 0.2

        relevance += (source_trust - 0.5) * 0.42
        return round(max(0.0, min(1.0, relevance)), 3)

    def get_sentiment(self, text: str) -> str:
        positive_words = [
            "bullish", "growth", "up", "gain", "profit", "surge", "higher", "positive",
            "dividend", "upgrade", "buy", "outperform", "partnership", "breakthrough",
        ]
        negative_words = [
            "bearish", "fall", "down", "loss", "drop", "lower", "negative", "crisis",
            "bankruptcy", "lawsuit", "downgrade", "sell", "underperform", "fraud", "debt",
        ]

        text_lower = self._normalize(text)
        pos_score = sum(1 for word in positive_words if word in text_lower)
        neg_score = sum(1 for word in negative_words if word in text_lower)

        if pos_score > neg_score * 1.2:
            return "Positive"
        if neg_score > pos_score * 1.2:
            return "Negative"
        return "Neutral"

    def get_signal_score(self, relevance: float, sentiment: str) -> float:
        sentiment_weight = {"Positive": 0.25, "Neutral": 0.0, "Negative": -0.25}.get(sentiment, 0.0)
        return round(max(-1.0, min(1.0, (relevance - 0.5) * 1.1 + sentiment_weight)), 3)

    def predict_market_impact(self, signal_score: float) -> str:
        if signal_score >= 0.28:
            return "Bullish"
        if signal_score <= -0.28:
            return "Bearish"
        return "Watch"

    def fetch_latest_news(
        self,
        limit: int = 15,
        min_relevance: float = 0.45,
        only_actionable: bool = True,
        source_types: List[str] | None = None,
    ) -> List[Dict[str, Any]]:
        all_articles: List[Dict[str, Any]] = []
        selected_source_types = {item.strip().lower() for item in source_types or [] if item.strip()}

        for feed_source in NEWS_SOURCES:
            if selected_source_types and feed_source["source_type"] not in selected_source_types:
                continue

            try:
                feed = feedparser.parse(feed_source["url"])
                for entry in feed.entries[:8]:
                    published_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
                    published_dt = (
                        datetime.fromtimestamp(time.mktime(published_parsed)) if published_parsed else datetime.now()
                    )

                    title = entry.get("title", "Untitled")
                    summary = entry.get("summary", "")
                    relevance_score = self.get_relevance_score(title, summary, feed_source["trust"])
                    if relevance_score < min_relevance:
                        continue

                    sentiment = self.get_sentiment(f"{title} {summary}")
                    signal_score = self.get_signal_score(relevance_score, sentiment)
                    prediction = self.predict_market_impact(signal_score)
                    if only_actionable and prediction == "Watch":
                        continue

                    all_articles.append(
                        {
                            "title": title,
                            "link": entry.get("link", feed_source["url"]),
                            "summary": summary,
                            "source": feed_source["label"],
                            "source_type": feed_source["source_type"],
                            "published_at": published_dt,
                            "sentiment": sentiment,
                            "relevance_score": relevance_score,
                            "signal_score": signal_score,
                            "prediction": prediction,
                        }
                    )
            except Exception as error:
                logger.error("Error fetching RSS %s: %s", feed_source["url"], error)

        if not all_articles:
            logger.warning("No articles fetched from selected sources. Returning fallback data.")
            all_articles = [
                {
                    "title": "Macro sentiment mixed as investors await central bank commentary",
                    "link": "https://finance.yahoo.com",
                    "summary": "Market participants are assessing inflation signals and earnings guidance before placing directional bets.",
                    "source": "Fallback Feed",
                    "source_type": "market",
                    "published_at": datetime.now(),
                    "sentiment": "Neutral",
                    "relevance_score": 0.71,
                    "signal_score": 0.23,
                    "prediction": "Watch",
                },
                {
                    "title": "Tech momentum builds after stronger-than-expected software earnings",
                    "link": "https://www.cnbc.com",
                    "summary": "AI and enterprise software stocks gained after multiple firms issued improved forward guidance.",
                    "source": "Fallback Feed",
                    "source_type": "blog",
                    "published_at": datetime.now(),
                    "sentiment": "Positive",
                    "relevance_score": 0.82,
                    "signal_score": 0.50,
                    "prediction": "Bullish",
                },
            ]

        all_articles.sort(key=lambda item: item["published_at"], reverse=True)
        return all_articles[:limit]


news_service = NewsService()
