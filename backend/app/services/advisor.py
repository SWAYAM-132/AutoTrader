import asyncio
import re
import json
import logging
from typing import Optional, Dict, Any, AsyncGenerator

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.llm import get_llm
from app.core.ticker_mapping import (
    TICKER_MAPPING,
    KEYWORD_TO_TICKER,
    normalize_crypto_symbol,
)
from app.services.coingecko import TICKER_TO_COINGECKO
from app.services.market_data import market_service
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

    def _extract_symbols(self, query: str) -> set:
        """Extract ticker symbols from user query using both regex and keyword mapping."""
        symbols = set(re.findall(r'\b[A-Z]{1,5}(?:-[A-Z]+)?\b', query))
        query_lower = query.lower()
        for keyword, ticker in KEYWORD_TO_TICKER.items():
            if keyword in query_lower:
                symbols.add(ticker)
        return symbols

    async def _get_price_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch price data — CoinGecko for crypto, Yahoo for stocks."""
        bare = normalize_crypto_symbol(symbol)
        if bare in TICKER_TO_COINGECKO:
            return await market_service.get_crypto_price(symbol)
        else:
            return await market_service.get_stock_price(symbol)

    async def _fetch_all_market_data(self, symbols: set) -> tuple:
        """Fetch price + historical data for all symbols in parallel."""
        market_info = []
        if not symbols:
            return market_info

        # Create all tasks at once
        price_tasks = {sym: self._get_price_data(sym) for sym in symbols}
        hist_tasks = {sym: market_service.get_historical_data(sym) for sym in symbols}

        # Run ALL price + history lookups in parallel
        all_tasks = list(price_tasks.values()) + list(hist_tasks.values())
        results = await asyncio.gather(*all_tasks, return_exceptions=True)

        n = len(symbols)
        price_results = results[:n]
        hist_results = results[n:]

        for i, sym in enumerate(symbols):
            price = price_results[i]
            if price and not isinstance(price, Exception):
                market_info.append(price)

            hist = hist_results[i]
            if hist and not isinstance(hist, Exception) and isinstance(hist, dict):
                market_info.append({"trend_summary": hist.get("summary", "")})

        return market_info

    async def _fetch_sentiment_data(self, symbols: set, news_items: list) -> list:
        """Compute sentiment from pre-fetched news for all symbols."""
        sentiment_info = []
        if not symbols or not news_items:
            return sentiment_info

        for sym in symbols:
            bare = normalize_crypto_symbol(sym)
            keywords = TICKER_MAPPING.get(bare, [bare])
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

        return sentiment_info

    def _build_enriched_context(
        self, context: str, market_info: list, sentiment_info: list,
        news_items: list, rag_docs: list
    ) -> str:
        """Build the enriched context string for the LLM prompt."""
        enriched = context

        if sentiment_info:
            enriched += "\nSentiment Analysis:\n" + json.dumps(
                sentiment_info, indent=2, default=str
            )

        if news_items:
            top_news = news_items[:5]
            enriched += "\nLatest Market News:\n" + json.dumps(
                top_news, indent=2, default=str
            )

        if rag_docs:
            enriched += "\nRelevant Knowledge Base Documents:\n"
            for doc in rag_docs:
                enriched += f"- {doc.get('content', '')[:500]}\n"

        if market_info:
            enriched += "\nReal-time Market Data:\n" + json.dumps(
                market_info, indent=2, default=str
            )

        return enriched

    async def analyze(self, query: str, context: str = "") -> str:
        symbols = self._extract_symbols(query)

        # ── Fetch ALL data sources in parallel ──
        market_task = self._fetch_all_market_data(symbols)
        news_task = news_service.fetch_latest_news_async(min_relevance=0.15)
        rag_task = asyncio.to_thread(rag_service.retrieve, query, 3)

        market_info, news_items, rag_docs = await asyncio.gather(
            market_task,
            news_task,
            rag_task,
            return_exceptions=False,
        )

        # Handle exceptions gracefully
        if isinstance(news_items, Exception):
            logger.warning("Failed to fetch news: %s", news_items)
            news_items = []
        if isinstance(rag_docs, Exception):
            logger.warning("Failed to retrieve RAG context: %s", rag_docs)
            rag_docs = []
        if isinstance(market_info, Exception):
            logger.warning("Failed to fetch market data: %s", market_info)
            market_info = []

        # Compute sentiment from news (fast, in-memory)
        sentiment_info = await self._fetch_sentiment_data(symbols, news_items)

        # Build context
        enriched_context = self._build_enriched_context(
            context, market_info, sentiment_info, news_items, rag_docs
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
            # HuggingFaceEndpoint sometimes fails on ainvoke() with StopIteration
            # Running the synchronous invoke() in a thread pool is safer and still non-blocking for FastAPI
            response = await asyncio.to_thread(
                chain.invoke,
                {
                    "query": query,
                    "context": enriched_context,
                }
            )
            return response
        except Exception as e:
            logger.error("Error calling LLM: %s", e)
            return (
                "I apologize, but I'm having trouble connecting to my analysis engine "
                "right now. Please try again in a moment."
            )

    async def analyze_stream(self, query: str, context: str = "") -> AsyncGenerator[str, None]:
        """Streaming version of analyze — yields tokens as they arrive."""
        symbols = self._extract_symbols(query)

        # Fetch all data sources in parallel
        market_task = self._fetch_all_market_data(symbols)
        news_task = news_service.fetch_latest_news_async(min_relevance=0.15)
        rag_task = asyncio.to_thread(rag_service.retrieve, query, 3)

        results = await asyncio.gather(
            market_task, news_task, rag_task,
            return_exceptions=True,
        )

        market_info = results[0] if not isinstance(results[0], Exception) else []
        news_items = results[1] if not isinstance(results[1], Exception) else []
        rag_docs = results[2] if not isinstance(results[2], Exception) else []

        sentiment_info = await self._fetch_sentiment_data(symbols, news_items)
        enriched_context = self._build_enriched_context(
            context, market_info, sentiment_info, news_items, rag_docs
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

        *Disclaimer: This is not financial advice.*
        """

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{query}")
        ])

        chain = prompt | self.llm | StrOutputParser()

        try:
            async for chunk in chain.astream({
                "query": query,
                "context": enriched_context,
            }):
                yield chunk
        except Exception as e:
            logger.error("Error in LLM stream: %s", e)
            yield (
                "I apologize, but I'm having trouble connecting to my analysis engine "
                "right now. Please try again in a moment."
            )

advisor_service = AdvisorService()
