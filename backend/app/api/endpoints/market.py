import logging
from typing import Any

import httpx
from fastapi import APIRouter

from app.core.ticker_mapping import TICKER_MAPPING, normalize_crypto_symbol
from app.services.coingecko import TICKER_TO_COINGECKO, coingecko_service
from app.services.news import news_service

logger = logging.getLogger(__name__)

router = APIRouter()


async def _fetch_stock_price_yahoo(symbol: str) -> tuple[float, float]:
    """
    Fetch stock price directly from Yahoo Finance chart API.
    Returns (current_price, change_percent).
    This bypasses the broken yfinance library.
    """
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    params = {"interval": "1d", "range": "2d"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()

        result = data["chart"]["result"][0]
        meta = result["meta"]
        price = meta.get("regularMarketPrice", 0)
        prev_close = meta.get("chartPreviousClose", meta.get("previousClose", price))

        change = 0.0
        if prev_close and prev_close > 0:
            change = ((price - prev_close) / prev_close) * 100

        return (price, round(change, 2))
    except Exception as e:
        logger.warning("Yahoo chart API error for %s: %s", symbol, e)
        return (0.0, 0.0)


@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str) -> Any:
    """
    Get sentiment score and recommendation for a specific ticker symbol.
    Uses CoinGecko for crypto, Yahoo Finance chart API for stocks.
    """
    symbol_upper = symbol.upper()

    # 1. Get Real Price Data
    current_price = 0.0
    price_change = 0.0

    # Normalize crypto tickers: BTC-USD → BTC, ETH-USD → ETH
    bare_symbol = normalize_crypto_symbol(symbol_upper)

    if bare_symbol in TICKER_TO_COINGECKO:
        # Crypto → CoinGecko (free, reliable)
        try:
            crypto_data = await coingecko_service.get_price(bare_symbol)
            if crypto_data:
                current_price = crypto_data["price"]
                price_change = crypto_data["change_percent"]
                logger.info(
                    "%s: CoinGecko price=$%.2f, change=%.2f%%",
                    bare_symbol, current_price, price_change,
                )
        except Exception as e:
            logger.warning("CoinGecko error for %s: %s", bare_symbol, e)
    else:
        # Stock → Yahoo Finance chart API (direct, no yfinance library)
        current_price, price_change = await _fetch_stock_price_yahoo(symbol_upper)
        if current_price > 0:
            logger.info(
                "%s: Yahoo chart price=$%.2f, change=%.2f%%",
                symbol_upper, current_price, price_change,
            )
        else:
            logger.warning("%s: Could not fetch stock price", symbol_upper)

    # 2. Fetch News — use bare symbol for keyword matching
    news = news_service.fetch_latest_news(min_relevance=0.15)

    relevant_news = []
    # Try both the original and bare symbol for keyword lookup
    search_keywords = TICKER_MAPPING.get(bare_symbol, TICKER_MAPPING.get(symbol_upper, [symbol_upper]))

    for n in news:
        title_text = n["title"].upper()
        summary_text = n["summary"].upper()
        if any(kw in title_text or kw in summary_text for kw in search_keywords):
            relevant_news.append(n)

    # Fallback: exact word match
    if not relevant_news and len(bare_symbol) <= 5:
        relevant_news = [
            n for n in news
            if any(word == bare_symbol for word in n["title"].upper().split())
            or any(word == bare_symbol for word in n["summary"].upper().split())
        ]

    # Calculate average sentiment
    scores = {"Positive": 1.0, "Neutral": 0.5, "Negative": 0.0}
    avg_score = 0.5
    if relevant_news:
        total_score = sum(scores.get(n["sentiment"], 0.5) for n in relevant_news)
        avg_score = total_score / len(relevant_news)

    # Calculate average credibility
    avg_credibility = 0.5
    if relevant_news:
        total_cred = sum(n.get("credibility_score", 0.5) for n in relevant_news)
        avg_credibility = total_cred / len(relevant_news)

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
        "price": round(current_price, 2),
        "change_percent": round(price_change, 2),
        "sentiment": sentiment,
        "score": round(avg_score, 2),
        "credibility": round(avg_credibility, 2),
        "recommendation": recommendation,
        "article_count": len(relevant_news),
    }

@router.get("/history/{symbol}")
async def get_history(symbol: str, period: str = "1mo", interval: str = "1d") -> Any:
    """
    Get historical market data for a symbol.
    """
    from app.services.market_data import market_service
    return await market_service.get_historical_data(symbol, period, interval)
