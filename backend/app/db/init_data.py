import asyncio
import logging
from sqlmodel import select
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User, UserCreate
from app.models.portfolio import PortfolioItem
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Demo user credentials ──────────────────────────────────────────────────────
DEMO_EMAIL = "demo@autotraderx.com"
DEMO_PASSWORD = "demo1234"
DEMO_FULL_NAME = "Swayam Gupta"

# ─── Rich demo portfolio ────────────────────────────────────────────────────────
# Realistic holdings across crypto, mega-cap tech, financials, energy, and ETFs
DEMO_PORTFOLIO = [
    # Crypto (bought at various cost basis)
    {"symbol": "BTC-USD", "quantity": 1.5,    "avg_cost": 42500.00},   # Bitcoin
    {"symbol": "ETH-USD", "quantity": 12.0,   "avg_cost": 2280.00},    # Ethereum
    {"symbol": "SOL-USD", "quantity": 85.0,   "avg_cost": 98.50},      # Solana

    # Mega-cap tech
    {"symbol": "AAPL",    "quantity": 50.0,   "avg_cost": 178.25},     # Apple
    {"symbol": "NVDA",    "quantity": 30.0,   "avg_cost": 485.00},     # NVIDIA
    {"symbol": "MSFT",    "quantity": 25.0,   "avg_cost": 375.00},     # Microsoft
    {"symbol": "GOOGL",   "quantity": 40.0,   "avg_cost": 138.50},     # Alphabet
    {"symbol": "AMZN",    "quantity": 20.0,   "avg_cost": 155.75},     # Amazon
    {"symbol": "META",    "quantity": 15.0,   "avg_cost": 325.00},     # Meta
    {"symbol": "TSLA",    "quantity": 35.0,   "avg_cost": 215.00},     # Tesla

    # Financials
    {"symbol": "JPM",     "quantity": 20.0,   "avg_cost": 172.50},     # JPMorgan
    {"symbol": "V",       "quantity": 18.0,   "avg_cost": 260.00},     # Visa

    # Energy
    {"symbol": "XOM",     "quantity": 40.0,   "avg_cost": 105.00},     # ExxonMobil

    # ETFs / Indices
    {"symbol": "SPY",     "quantity": 15.0,   "avg_cost": 450.00},     # S&P 500
    {"symbol": "QQQ",     "quantity": 10.0,   "avg_cost": 385.00},     # Nasdaq 100
]


async def seed_demo_user():
    """
    Create the demo user with a rich portfolio.
    Idempotent — skips if user already exists.
    """
    async with AsyncSessionLocal() as session:
        # Check if demo user already exists
        result = await session.execute(
            select(User).where(User.email == DEMO_EMAIL)
        )
        existing_user = result.scalars().first()

        if existing_user:
            logger.info("Demo user already exists (id=%d), checking portfolio...", existing_user.id)
            user_id = existing_user.id
        else:
            # Create demo user
            demo_user = User(
                email=DEMO_EMAIL,
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name=DEMO_FULL_NAME,
                is_active=True,
                is_superuser=True,
            )
            session.add(demo_user)
            await session.commit()
            await session.refresh(demo_user)
            user_id = demo_user.id
            logger.info("Created demo user: %s (id=%d)", DEMO_EMAIL, user_id)

        # Check if portfolio already seeded
        result = await session.execute(
            select(PortfolioItem).where(PortfolioItem.user_id == user_id)
        )
        existing_items = result.scalars().all()

        if existing_items:
            logger.info("Demo portfolio already has %d items, skipping seed.", len(existing_items))
            return user_id

        # Seed portfolio
        for holding in DEMO_PORTFOLIO:
            item = PortfolioItem(
                user_id=user_id,
                symbol=holding["symbol"],
                quantity=holding["quantity"],
                avg_cost=holding["avg_cost"],
            )
            session.add(item)

        await session.commit()
        logger.info(
            "Seeded %d portfolio items for demo user %s",
            len(DEMO_PORTFOLIO), DEMO_EMAIL,
        )
        return user_id


async def main():
    await seed_demo_user()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
