import re
import json
import logging
from typing import Optional, Dict, Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.llm import get_llm
from app.services.market_data import market_service, _normalize_crypto
from app.services.coingecko import TICKER_TO_COINGECKO
from app.services.news import news_service
from app.services.rag import rag_service

logger = logging.getLogger(__name__)


class AdvisorService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = get_llm()
        return self._llm

    async def _get_price_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch price data — CoinGecko for crypto, Yahoo for stocks."""
        bare = _normalize_crypto(symbol)
        if bare in TICKER_TO_COINGECKO:
            return await market_service.get_crypto_price(symbol)
        else:
            return await market_service.get_stock_price(symbol)

    async def analyze(self, query: str, context: str = "") -> str:
        enriched_context = context

        # Map natural language names to ticker symbols
        KEYWORD_TO_TICKER = {
            "bitcoin": "BTC", "btc": "BTC",
            "ethereum": "ETH", "eth": "ETH",
            "solana": "SOL", "dogecoin": "DOGE",
            "ripple": "XRP", "cardano": "ADA",
            "apple": "AAPL", "nvidia": "NVDA", "tesla": "TSLA",
            "microsoft": "MSFT", "amazon": "AMZN", "google": "GOOGL",
            "meta": "META", "facebook": "META",
        }

        # Extract uppercase ticker symbols from the query (e.g., AAPL, TSLA)
        symbols = set(re.findall(r'\b[A-Z]{1,5}(?:-[A-Z]+)?\b', query))

        # Also match natural language names (lowercase)
        query_lower = query.lower()
        for keyword, ticker in KEYWORD_TO_TICKER.items():
            if keyword in query_lower:
                symbols.add(ticker)

        # Fetch real-time price data for matched symbols
        market_info = []
        if symbols:
            for symbol in symbols:
                price = await self._get_price_data(symbol)
                if price:
                    market_info.append(price)

                # Try historical data (works for stocks via Yahoo)
                try:
                    hist = await market_service.get_historical_data(symbol)
                    if hist:
                        market_info.append({"trend_summary": hist["summary"]})
                except Exception:
                    pass

        # Fetch sentiment data for the primary symbol
        sentiment_info = []
        if symbols:
            from app.services.news import news_service as ns
            news_items = ns.fetch_latest_news(min_relevance=0.15)

            # Simple sentiment analysis per symbol
            SENTIMENT_KEYWORDS = {
                "BTC": ["BITCOIN", "BTC", "CRYPTO"],
                "ETH": ["ETHEREUM", "ETH"],
                "NVDA": ["NVIDIA", "NVDA", "GPU", "AI CHIP"],
                "AAPL": ["APPLE", "AAPL", "IPHONE"],
                "TSLA": ["TESLA", "TSLA", "EV", "ELON"],
                "MSFT": ["MICROSOFT", "MSFT", "AZURE"],
                "GOOGL": ["GOOGLE", "GOOGL", "ALPHABET"],
                "META": ["META", "FACEBOOK", "INSTAGRAM"],
                "AMZN": ["AMAZON", "AMZN", "AWS"],
                "SOL": ["SOLANA", "SOL"],
                "DOGE": ["DOGECOIN", "DOGE"],
                "XRP": ["RIPPLE", "XRP"],
                "ADA": ["CARDANO", "ADA"],
            }

            for sym in symbols:
                bare = _normalize_crypto(sym)
                keywords = SENTIMENT_KEYWORDS.get(bare, [bare])
                relevant = []
                for n in news_items[:50]:
                    text = f"{n['title']} {n['summary']}".upper()
                    if any(kw in text for kw in keywords):
                        relevant.append(n)

                if relevant:
                    scores = {"Positive": 1.0, "Neutral": 0.5, "Negative": 0.0}
                    avg = sum(scores.get(n["sentiment"], 0.5) for n in relevant) / len(relevant)
                    sentiment_label = "Neutral"
                    if avg > 0.65:
                        sentiment_label = "Bullish"
                    elif avg < 0.35:
                        sentiment_label = "Bearish"

                    sentiment_info.append({
                        "symbol": bare,
                        "sentiment": sentiment_label,
                        "score": round(avg, 2),
                        "article_count": len(relevant),
                        "top_headlines": [n["title"] for n in relevant[:3]],
                    })

        if sentiment_info:
            enriched_context += "\nSentiment Analysis:\n" + json.dumps(
                sentiment_info, indent=2, default=str
            )

        # Fetch latest news (top 5)
        try:
            news = news_service.fetch_latest_news(min_relevance=0.15)[:5]
            if news:
                enriched_context += "\nLatest Market News:\n" + json.dumps(
                    news, indent=2, default=str
                )
        except Exception as e:
            logger.warning("Failed to fetch news for advisor context: %s", e)

        # Retrieve relevant documents from RAG store
        try:
            rag_docs = rag_service.retrieve(query, k=3)
            if rag_docs:
                enriched_context += "\nRelevant Knowledge Base Documents:\n"
                for doc in rag_docs:
                    enriched_context += f"- {doc.get('content', '')[:500]}\n"
        except Exception as e:
            logger.warning("Failed to retrieve RAG context: %s", e)

        if market_info:
            enriched_context += "\nReal-time Market Data:\n" + json.dumps(
                market_info, indent=2, default=str
            )

        system_prompt = """You are an expert financial advisor named "AutoTraderX AI".
        Your goal is to provide insightful, data-backed investment analysis.

        Current Context (Market Data & News):
        {context}

        Instructions:
        1. **Format your response using Markdown**. Use bold text for key terms and bullet points for lists.
        2. Predict trends based on the current news feed and historical data provided.
        3. Reference the SENTIMENT DATA if available — tell the user whether news sentiment is bullish, bearish, or neutral.
        4. Provide actionable suggestions (e.g., "Consider watching resistance at $X").
        5. Maintain a professional, data-driven tone.
        6. Always mention that this is **NOT financial advice**.
        7. If news sentiment is overwhelmingly positive/negative, incorporate that into your prediction.

        Example Structure:
        ### 📈 Market Analysis: [Ticker]
        - **Current Price**: [Price]
        - **Trend**: [Description]

        ### 📰 News & Sentiment
        - **Overall Sentiment**: [Bullish/Bearish/Neutral] (based on [X] articles)
        - [Important News 1]
        - [Important News 2]

        ### 💡 Recommendation
        - [Actionable Insights]

        *Disclaimer: This is not financial advice.*
        """

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{query}")
        ])

        chain = prompt | self.llm | StrOutputParser()

        try:
            response = await chain.ainvoke({
                "query": query,
                "context": enriched_context,
            })
            return response
        except Exception as e:
            logger.error("Error calling LLM: %s", e)
            return (
                "I apologize, but I'm having trouble connecting to my analysis engine "
                "right now. Please try again in a moment."
            )


advisor_service = AdvisorService()
