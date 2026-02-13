import asyncio
import logging
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User, UserCreate
from app.core.security import get_password_hash
from faker import Faker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fake = Faker()

async def create_users(n=5):
    async with AsyncSessionLocal() as session:
        for _ in range(n):
            email = fake.email()
            password = "password123"
            full_name = fake.name()
            
            user_in = UserCreate(
                email=email,
                password=password,
                full_name=full_name
            )
            
            user = User(
                email=user_in.email,
                hashed_password=get_password_hash(user_in.password),
                full_name=user_in.full_name,
                is_active=True
            )
            session.add(user)
        
        # Create a specific test user
        test_user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password"),
            full_name="Test User",
            is_active=True,
            is_superuser=True
        )
        session.add(test_user)
        
        await session.commit()
        logger.info(f"Created {n} synthetic users + 1 test user")

async def main():
    await create_users()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
