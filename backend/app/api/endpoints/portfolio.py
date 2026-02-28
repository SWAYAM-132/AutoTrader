import asyncio
import logging
from typing import Any, List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.deps import get_current_user, get_session
from app.models.portfolio import PortfolioCreate, PortfolioItem, PortfolioRead
from app.models.user import User
from app.services.coingecko import TICKER_TO_COINGECKO, coingecko_service

logger = logging.getLogger(__name__)

router = APIRouter()

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


async def _fetch_stock_price(symbol: str) -> float:
    """Fetch a single stock price from Yahoo chart API."""
    url = YAHOO_CHART_URL.format(symbol=symbol)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=YAHOO_HEADERS, params={"interval": "1d", "range": "1d"})
            resp.raise_for_status()
            data = resp.json()
        return data["chart"]["result"][0]["meta"].get("regularMarketPrice", 0.0)
    except Exception as e:
        logger.warning("Yahoo chart error for %s: %s", symbol, e)
        return 0.0


@router.get("/", response_model=List[PortfolioRead])
async def read_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """Retrieve user's portfolio with real-time price data."""
    result = await db.execute(
        select(PortfolioItem).where(PortfolioItem.user_id == current_user.id)
    )
    items = result.scalars().all()

    if not items:
        return []

    symbols = [item.symbol for item in items]

    # Separate crypto and stock symbols (normalize -USD suffix)
    crypto_symbols = [s for s in symbols if _normalize_crypto(s) in TICKER_TO_COINGECKO]
    stock_symbols = [s for s in symbols if _normalize_crypto(s) not in TICKER_TO_COINGECKO]

    current_prices: dict[str, float] = {}

    # Fetch crypto prices from CoinGecko (single batched call)
    if crypto_symbols:
        try:
            crypto_data = await coingecko_service.get_all_prices()
            for sym in crypto_symbols:
                bare = _normalize_crypto(sym)
                if bare in crypto_data:
                    current_prices[sym] = crypto_data[bare]["price"]
                else:
                    current_prices[sym] = 0.0
        except Exception as e:
            logger.error("CoinGecko error for portfolio: %s", e)
            for sym in crypto_symbols:
                current_prices[sym] = 0.0

    # Fetch stock prices from Yahoo chart API (parallel)
    if stock_symbols:
        tasks = [_fetch_stock_price(sym) for sym in stock_symbols]
        prices = await asyncio.gather(*tasks)
        for sym, price in zip(stock_symbols, prices):
            current_prices[sym] = price

    portfolio_data = []
    for item in items:
        current_price = current_prices.get(item.symbol, 0.0)
        value = current_price * item.quantity
        cost_basis = item.avg_cost * item.quantity
        pnl = value - cost_basis
        pnl_percent = (pnl / cost_basis * 100) if cost_basis > 0 else 0.0

        portfolio_data.append(
            PortfolioRead(
                id=item.id,
                symbol=item.symbol,
                quantity=item.quantity,
                avg_cost=item.avg_cost,
                current_price=current_price,
                value=value,
                pnl=pnl,
                pnl_percent=pnl_percent,
            )
        )

    return portfolio_data


@router.post("/", response_model=PortfolioRead)
async def add_to_portfolio(
    item_in: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """Add a new item to the portfolio."""
    item = PortfolioItem(
        user_id=current_user.id,
        symbol=item_in.symbol.upper(),
        quantity=item_in.quantity,
        avg_cost=item_in.avg_cost,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return PortfolioRead(
        id=item.id,
        symbol=item.symbol,
        quantity=item.quantity,
        avg_cost=item.avg_cost,
    )


@router.delete("/{item_id}")
async def delete_from_portfolio(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """Remove an item from the portfolio."""
    item = await db.get(PortfolioItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(item)
    await db.commit()
    return {"ok": True}

