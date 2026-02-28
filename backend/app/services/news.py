import hashlib
import logging
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, TypedDict

import feedparser
import httpx

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


class FeedSource(TypedDict):
    label: str
    url: str
    source_type: str
    trust: float


NEWS_SOURCES: List[FeedSource] = [
    # ─── Google News RSS (always fresh, aggregates top sources) ──────────────────
    {"label": "Google News: Stock Market", "url": "https://news.google.com/rss/search?q=stock+market+today&hl=en-US&gl=US&ceid=US:en", "source_type": "market", "trust": 0.88},
    {"label": "Google News: Crypto", "url": "https://news.google.com/rss/search?q=cryptocurrency+bitcoin+ethereum&hl=en-US&gl=US&ceid=US:en", "source_type": "market", "trust": 0.85},
    {"label": "Google News: Business", "url": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en", "source_type": "market", "trust": 0.88},
    {"label": "Google News: Investing", "url": "https://news.google.com/rss/search?q=investing+stocks+earnings&hl=en-US&gl=US&ceid=US:en", "source_type": "market", "trust": 0.85},
    # ─── Direct feeds ───────────────────────────────────────────────────────────
    {"label": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex", "source_type": "market", "trust": 0.82},
    {"label": "CNBC", "url": "https://www.cnbc.com/id/10000664/device/rss/rss.html", "source_type": "market", "trust": 0.90},
    {"label": "Investing.com", "url": "https://www.investing.com/rss/news_25.rss", "source_type": "market", "trust": 0.80},
    {"label": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "source_type": "market", "trust": 0.75},
    {"label": "Reddit r/stocks", "url": "https://www.reddit.com/r/stocks/.rss", "source_type": "social", "trust": 0.58},
    {"label": "Reddit r/investing", "url": "https://www.reddit.com/r/investing/.rss", "source_type": "social", "trust": 0.6},
    {"label": "Reddit r/wallstreetbets", "url": "https://www.reddit.com/r/wallstreetbets/.rss", "source_type": "social", "trust": 0.42},
    {"label": "Seeking Alpha", "url": "https://seekingalpha.com/feed.xml", "source_type": "blog", "trust": 0.72},
    {"label": "Calculated Risk", "url": "https://www.calculatedriskblog.com/feeds/posts/default", "source_type": "blog", "trust": 0.74},
]

# ─── Keyword Dictionaries ──────────────────────────────────────────────────────

MARKET_RELEVANCE_KEYWORDS = {
    # Earnings & Financials
    "earnings": 0.16, "guidance": 0.12, "revenue": 0.12, "profit": 0.12,
    "eps": 0.12, "dividend": 0.10, "buyback": 0.10, "share repurchase": 0.10,
    # Central Banks & Macro
    "inflation": 0.14, "interest rate": 0.15, "federal reserve": 0.15,
    "fed": 0.14, "gdp": 0.12, "unemployment": 0.10, "cpi": 0.12,
    "recession": 0.14, "stimulus": 0.12, "treasury": 0.10,
    # M&A, Regulation
    "analyst": 0.1, "upgrade": 0.12, "downgrade": 0.12,
    "merger": 0.14, "acquisition": 0.14, "ipo": 0.12, "spac": 0.10,
    "sec": 0.1, "lawsuit": 0.09, "bankruptcy": 0.14, "regulation": 0.10,
    "sanctions": 0.12, "antitrust": 0.10,
    # Commodities & Sectors
    "tariff": 0.1, "oil": 0.08, "gold": 0.08, "commodities": 0.08,
    # Crypto
    "crypto": 0.08, "bitcoin": 0.08, "ethereum": 0.08, "defi": 0.07,
    "blockchain": 0.07, "nft": 0.05, "stablecoin": 0.07,
    # ETFs & Indices
    "etf": 0.1, "s&p 500": 0.10, "nasdaq": 0.10, "dow jones": 0.10,
    # Geopolitics
    "trade war": 0.12, "geopolitical": 0.10, "election": 0.08,
}

NOISE_KEYWORDS = {
    "lifestyle", "celebrity", "sports", "recipe", "travel", "sponsored",
    "horoscope", "entertainment", "reality tv", "viral",
}

# ─── Credibility Indicators ─────────────────────────────────────────────────────

CREDIBILITY_POSITIVE = {
    "according to", "data shows", "report says", "analysts say",
    "study finds", "research indicates", "official statement",
    "sec filing", "earnings report", "conference call",
}

CREDIBILITY_NEGATIVE = {
    "rumor", "unconfirmed", "sources say", "allegedly", "speculation",
    "could be", "might be", "opinion", "i think", "prediction",
    "to the moon", "diamond hands", "yolo", "trust me bro",
}

# ─── Cache ───────────────────────────────────────────────────────────────────────

_news_cache: Dict[str, Any] = {
    "data": [],
    "fetched_at": 0.0,
}
NEWS_CACHE_TTL_SECONDS = 300  # 5 minutes


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

    def get_credibility_score(self, text: str, source_trust: float) -> float:
        """
        Evaluate how credible/trustworthy a piece of news is.
        Combines source trust with content-level signals.
        Returns a score between 0.0 and 1.0.
        """
        normalized = self._normalize(text)

        positive_signals = sum(
            1 for indicator in CREDIBILITY_POSITIVE if indicator in normalized
        )
        negative_signals = sum(
            1 for indicator in CREDIBILITY_NEGATIVE if indicator in normalized
        )

        # Start with source trust as baseline (weighted 60%)
        score = source_trust * 0.6

        # Content-based credibility adjustment (weighted 40%)
        content_score = 0.5 + (positive_signals * 0.08) - (negative_signals * 0.12)
        content_score = max(0.0, min(1.0, content_score))
        score += content_score * 0.4

        return round(max(0.0, min(1.0, score)), 3)

    def get_sentiment(self, text: str) -> str:
        positive_words = [
            "bullish", "growth", "up", "gain", "profit", "surge", "higher", "positive",
            "dividend", "upgrade", "buy", "outperform", "partnership", "breakthrough",
            "record", "rally", "rebound", "soar", "strong", "beat", "exceed",
        ]
        negative_words = [
            "bearish", "fall", "down", "loss", "drop", "lower", "negative", "crisis",
            "bankruptcy", "lawsuit", "downgrade", "sell", "underperform", "fraud", "debt",
            "plunge", "crash", "decline", "miss", "weak", "default", "layoff",
        ]

        text_lower = self._normalize(text)
        pos_score = sum(1 for word in positive_words if word in text_lower)
        neg_score = sum(1 for word in negative_words if word in text_lower)

        if pos_score > neg_score:
            return "Positive"
        if neg_score > pos_score:
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

    def _content_hash(self, title: str, link: str) -> str:
        """Generate a hash for deduplication."""
        return hashlib.md5(f"{title}|{link}".encode()).hexdigest()

    def fetch_latest_news(
        self,
        min_relevance: float = 0.30,
        only_actionable: bool = False,
        source_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        global _news_cache

        # ── Return cached data if still fresh ──
        cache_age = time.time() - _news_cache["fetched_at"]
        if _news_cache["data"] and cache_age < NEWS_CACHE_TTL_SECONDS and source_types is None:
            logger.info("Returning cached news (%d articles, %.0fs old)", len(_news_cache["data"]), cache_age)
            # Apply filters to cached data
            filtered = [
                a for a in _news_cache["data"]
                if a["relevance_score"] >= min_relevance
                and (not only_actionable or a["prediction"] != "Watch")
            ]
            return filtered

        # ── Fetch fresh data ──
        all_articles: List[Dict[str, Any]] = []
        seen_hashes: set = set()
        selected_source_types = {item.strip().lower() for item in source_types or [] if item.strip()}

        with httpx.Client(verify=False, follow_redirects=True, timeout=10.0) as client:
            for feed_source in NEWS_SOURCES:
                if selected_source_types and feed_source["source_type"] not in selected_source_types:
                    continue

                try:
                    logger.info("Fetching news from: %s", feed_source["label"])
                    response = client.get(feed_source["url"], headers={"User-Agent": USER_AGENT})

                    if response.status_code != 200:
                        logger.warning("Failed to fetch %s: HTTP %s", feed_source["url"], response.status_code)
                        continue

                    feed = feedparser.parse(response.text)
                    for entry in feed.entries[:8]:
                        published_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
                        published_dt = (
                            datetime.fromtimestamp(time.mktime(published_parsed)) if published_parsed else datetime.now()
                        )

                        title = entry.get("title", "Untitled")
                        link = entry.get("link", feed_source["url"])
                        summary = entry.get("summary", "")

                        # Deduplicate
                        content_hash = self._content_hash(title, link)
                        if content_hash in seen_hashes:
                            continue
                        seen_hashes.add(content_hash)

                        relevance_score = self.get_relevance_score(title, summary, feed_source["trust"])
                        sentiment = self.get_sentiment(f"{title} {summary}")
                        signal_score = self.get_signal_score(relevance_score, sentiment)
                        prediction = self.predict_market_impact(signal_score)
                        credibility = self.get_credibility_score(
                            f"{title} {summary}", feed_source["trust"]
                        )

                        all_articles.append(
                            {
                                "title": title,
                                "link": link,
                                "summary": summary,
                                "source": feed_source["label"],
                                "source_type": feed_source["source_type"],
                                "published_at": published_dt,
                                "sentiment": sentiment,
                                "relevance_score": relevance_score,
                                "signal_score": signal_score,
                                "prediction": prediction,
                                "credibility_score": credibility,
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
                    "credibility_score": 0.80,
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
                    "credibility_score": 0.85,
                },
            ]

        all_articles.sort(key=lambda item: item["published_at"], reverse=True)

        # ── Update cache (only if no source_type filter was applied) ──
        if not selected_source_types:
            _news_cache = {
                "data": all_articles,
                "fetched_at": time.time(),
            }

        # ── Apply filters ──
        filtered = [
            a for a in all_articles
            if a["relevance_score"] >= min_relevance
            and (not only_actionable or a["prediction"] != "Watch")
        ]

        return filtered


news_service = NewsService()
