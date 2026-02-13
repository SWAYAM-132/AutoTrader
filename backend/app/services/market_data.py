import yfinance as yf
import ccxt.async_support as ccxt
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class MarketDataService:
    async def get_stock_price(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time stock data using yfinance.
        """
        try:
            ticker_obj = yf.Ticker(ticker)
            # fast_info is faster than .info
            info = ticker_obj.fast_info
            
            # fast_info provides basic price data
            if info:
                 return {
                    "symbol": ticker.upper(),
                    "price": info.last_price,
                    "previous_close": info.previous_close,
                    "change_percent": ((info.last_price - info.previous_close) / info.previous_close) * 100 if info.previous_close else 0,
                    "currency": info.currency,
                    "type": "stock"
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching stock data for {ticker}: {e}")
            return None

    async def get_crypto_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time crypto data using CCXT (Binance).
        Symbol format: 'BTC/USDT'
        """
        exchange = ccxt.binance()
        try:
            ticker = await exchange.fetch_ticker(symbol)
            return {
                "symbol": symbol.upper(),
                "price": ticker['last'],
                "change_percent": ticker['percentage'],
                "high_24h": ticker['high'],
                "low_24h": ticker['low'],
                "volume": ticker['quoteVolume'],
                "type": "crypto"
            }
        except Exception as e:
            logger.error(f"Error fetching crypto data for {symbol}: {e}")
            return None
        finally:
            await exchange.close()

    async def get_historical_data(self, ticker: str, period: str = "1mo", interval: str = "1d") -> Optional[Dict[str, Any]]:
        """
        Fetch historical market data using yfinance.
        """
        try:
            ticker_obj = yf.Ticker(ticker)
            hist = ticker_obj.history(period=period, interval=interval)
            
            if not hist.empty:
                return {
                    "symbol": ticker.upper(),
                    "history": hist.tail(10).to_dict(orient="records"), # Return last 10 points for context
                    "summary": f"Last 10 days trend for {ticker}"
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker}: {e}")
            return None

market_service = MarketDataService()
