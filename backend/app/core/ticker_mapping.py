"""
Shared ticker/symbol mapping used across market, advisor, and sentiment services.
Single source of truth for symbol normalization and keyword matching.
"""

# ─── Ticker → Keywords mapping ────────────────────────────────────────────────
# Maps a canonical ticker symbol to a list of keywords that might appear in
# news headlines, social media, or user queries.

TICKER_MAPPING: dict[str, list[str]] = {
    # Tech
    "BTC": ["BITCOIN", "BTC", "CRYPTO"],
    "ETH": ["ETHEREUM", "ETH", "CRYPTO"],
    "AAPL": ["APPLE", "AAPL", "IPHONE", "MACBOOK", "IPAD"],
    "TSLA": ["TESLA", "TSLA", "ELON MUSK", "EV"],
    "NVDA": ["NVIDIA", "NVDA", "GPU", "AI CHIP", "CUDA"],
    "MSFT": ["MICROSOFT", "MSFT", "AZURE", "OPENAI", "COPILOT"],
    "AMZN": ["AMAZON", "AMZN", "AWS", "PRIME"],
    "GOOGL": ["GOOGLE", "ALPHABET", "GOOGL", "GEMINI", "WAYMO"],
    "META": ["FACEBOOK", "META", "INSTAGRAM", "ZUCKERBERG", "WHATSAPP", "THREADS"],
    # Financials
    "JPM": ["JPMORGAN", "JPM", "CHASE"],
    "V": ["VISA"],
    "MA": ["MASTERCARD"],
    "GS": ["GOLDMAN SACHS", "GS"],
    # Healthcare
    "LLY": ["ELI LILLY", "LLY", "MOUNJARO"],
    "JNJ": ["JOHNSON", "JNJ"],
    "UNH": ["UNITEDHEALTH", "UNH"],
    # Consumer / Retail
    "WMT": ["WALMART", "WMT"],
    "COST": ["COSTCO", "COST"],
    # Crypto
    "SOL": ["SOLANA", "SOL"],
    "XRP": ["RIPPLE", "XRP"],
    "DOGE": ["DOGECOIN", "DOGE"],
    "ADA": ["CARDANO", "ADA"],
    # Energy
    "XOM": ["EXXON", "XOM"],
    "CVX": ["CHEVRON", "CVX"],
    # Indices
    "SPY": ["S&P 500", "SPY", "S&P"],
    "QQQ": ["NASDAQ", "QQQ"],
}

# ─── Natural language → Ticker mapping ─────────────────────────────────────────
# Maps lowercase natural language names/aliases to their canonical ticker.

KEYWORD_TO_TICKER: dict[str, str] = {
    "bitcoin": "BTC", "btc": "BTC",
    "ethereum": "ETH", "eth": "ETH",
    "solana": "SOL", "dogecoin": "DOGE",
    "ripple": "XRP", "cardano": "ADA",
    "apple": "AAPL", "nvidia": "NVDA", "tesla": "TSLA",
    "microsoft": "MSFT", "amazon": "AMZN", "google": "GOOGL",
    "meta": "META", "facebook": "META",
    "jpmorgan": "JPM", "visa": "V", "mastercard": "MA",
    "goldman": "GS", "walmart": "WMT",
}


def normalize_crypto_symbol(symbol: str) -> str:
    """Strip -USD / -USDT / /USDT suffixes to get a bare crypto ticker."""
    s = symbol.upper()
    for suffix in ("-USD", "-USDT", "/USDT", "/USD"):
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    return s
