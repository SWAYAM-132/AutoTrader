import logging
from typing import Dict, Any, Optional

import httpx

from app.services.coingecko import coingecko_service, TICKER_TO_COINGECKO

logger = logging.getLogger(__name__)

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


def _normalize_crypto(symbol: str) -> str:
    s = symbol.upper()
    for suffix in ("-USD", "-USDT", "/USDT", "/USD"):
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    return s


class MarketDataService:
    async def get_stock_price(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time stock data using Yahoo Finance chart API directly.
        """
        url = YAHOO_CHART_URL.format(symbol=ticker)
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, headers=YAHOO_HEADERS, params={"interval": "1d", "range": "2d"})
                resp.raise_for_status()
                data = resp.json()

            result = data["chart"]["result"][0]
            meta = result["meta"]
            price = meta.get("regularMarketPrice", 0)
            prev_close = meta.get("chartPreviousClose", meta.get("previousClose", price))
            change = ((price - prev_close) / prev_close) * 100 if prev_close else 0

            return {
                "symbol": ticker.upper(),
                "price": price,
                "previous_close": prev_close,
                "change_percent": round(change, 2),
                "currency": meta.get("currency", "USD"),
                "type": "stock",
            }
        except Exception as e:
            logger.error("Yahoo chart API error for %s: %s", ticker, e)
            return None

    async def get_crypto_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time crypto data using CoinGecko (free, no API key).
        Accepts: 'BTC', 'BTC-USD', 'BTC/USDT', 'ETH', etc.
        """
        clean = _normalize_crypto(symbol)

        if clean not in TICKER_TO_COINGECKO:
            logger.info("Unknown crypto symbol: %s", clean)
            return None

        try:
            data = await coingecko_service.get_price(clean)
            if data:
                return {
                    "symbol": clean,
                    "price": data["price"],
                    "change_percent": data["change_percent"],
                    "high_24h": None,
                    "low_24h": None,
                    "volume": data.get("volume_24h", 0),
                    "market_cap": data.get("market_cap", 0),
                    "type": "crypto",
                }
            return None
        except Exception as e:
            logger.error("CoinGecko error for %s: %s", clean, e)
            return None

    async def get_historical_data(self, ticker: str, period: str = "1mo", interval: str = "1d") -> Optional[Dict[str, Any]]:
        """
        Fetch historical market data using Yahoo Finance chart API.
        """
        url = YAHOO_CHART_URL.format(symbol=ticker)
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    url,
                    headers=YAHOO_HEADERS,
                    params={"interval": interval, "range": period},
                )
                resp.raise_for_status()
                data = resp.json()

            result = data["chart"]["result"][0]
            timestamps = result.get("timestamp", [])
            indicators = result.get("indicators", {}).get("quote", [{}])[0]

            history = []
            for i, ts in enumerate(timestamps[-10:]):
                idx = len(timestamps) - 10 + i if len(timestamps) > 10 else i
                history.append({
                    "timestamp": ts,
                    "open": indicators.get("open", [None] * len(timestamps))[idx],
                    "high": indicators.get("high", [None] * len(timestamps))[idx],
                    "low": indicators.get("low", [None] * len(timestamps))[idx],
                    "close": indicators.get("close", [None] * len(timestamps))[idx],
                    "volume": indicators.get("volume", [None] * len(timestamps))[idx],
                })

            return {
                "symbol": ticker.upper(),
                "history": history,
                "summary": f"Last {len(history)} data points for {ticker}",
            }
        except Exception as e:
            logger.error("Yahoo chart API error for historical %s: %s", ticker, e)
            return None


market_service = MarketDataService()

