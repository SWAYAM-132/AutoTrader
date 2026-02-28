"""
CoinGecko service — free, no API key required.
Provides real-time crypto prices, 24h change, market cap, and volume.
"""

import logging
import time
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Map common ticker symbols → CoinGecko IDs
TICKER_TO_COINGECKO: Dict[str, str] = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "DOGE": "dogecoin",
    "XRP": "ripple",
    "ADA": "cardano",
    "DOT": "polkadot",
    "AVAX": "avalanche-2",
    "MATIC": "matic-network",
    "LINK": "chainlink",
    "UNI": "uniswap",
    "ATOM": "cosmos",
    "LTC": "litecoin",
    "SHIB": "shiba-inu",
    "BNB": "binancecoin",
}

# Simple cache to respect CoinGecko's rate limits (10-30 calls/min free)
_price_cache: Dict[str, Any] = {}
_cache_ts: float = 0.0
CACHE_TTL = 60  # 1 minute


class CoinGeckoService:
    """Lightweight CoinGecko wrapper using httpx."""

    def _is_crypto(self, symbol: str) -> bool:
        """Check if a symbol is a known crypto ticker."""
        return symbol.upper() in TICKER_TO_COINGECKO

    async def get_all_prices(self) -> Dict[str, Dict[str, Any]]:
        """
        Fetch prices for all tracked cryptos in a single API call.
        Returns dict keyed by ticker symbol (e.g. 'BTC').
        """
        global _price_cache, _cache_ts

        if _price_cache and (time.time() - _cache_ts) < CACHE_TTL:
            return _price_cache

        ids = ",".join(TICKER_TO_COINGECKO.values())
        url = (
            f"{COINGECKO_BASE}/simple/price"
            f"?ids={ids}"
            f"&vs_currencies=usd"
            f"&include_24hr_change=true"
            f"&include_24hr_vol=true"
            f"&include_market_cap=true"
            f"&include_last_updated_at=true"
        )

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            # Re-key by ticker symbol
            id_to_ticker = {v: k for k, v in TICKER_TO_COINGECKO.items()}
            result: Dict[str, Dict[str, Any]] = {}

            for cg_id, info in data.items():
                ticker = id_to_ticker.get(cg_id, cg_id.upper())
                result[ticker] = {
                    "symbol": ticker,
                    "price": info.get("usd", 0),
                    "change_percent": round(info.get("usd_24h_change", 0), 2),
                    "market_cap": info.get("usd_market_cap", 0),
                    "volume_24h": info.get("usd_24h_vol", 0),
                    "last_updated": info.get("last_updated_at", 0),
                    "type": "crypto",
                    "currency": "USD",
                }

            _price_cache = result
            _cache_ts = time.time()
            logger.info("CoinGecko: fetched %d crypto prices", len(result))
            return result

        except Exception as e:
            logger.error("CoinGecko API error: %s", e)
            return _price_cache  # Return stale cache if available

    async def get_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get price for a single crypto ticker."""
        upper = symbol.upper()
        if upper not in TICKER_TO_COINGECKO:
            return None

        prices = await self.get_all_prices()
        return prices.get(upper)

    async def get_trending(self) -> List[Dict[str, Any]]:
        """Get trending coins from CoinGecko."""
        url = f"{COINGECKO_BASE}/search/trending"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            coins = []
            for item in data.get("coins", [])[:10]:
                coin = item.get("item", {})
                coins.append({
                    "name": coin.get("name", ""),
                    "symbol": coin.get("symbol", ""),
                    "market_cap_rank": coin.get("market_cap_rank"),
                    "price_btc": coin.get("price_btc", 0),
                })
            return coins
        except Exception as e:
            logger.error("CoinGecko trending error: %s", e)
            return []


coingecko_service = CoinGeckoService()
