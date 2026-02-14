from fastapi import APIRouter
from app.api.endpoints import auth, users, market, news, advisor, webhooks, portfolio

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(advisor.router, prefix="/advisor", tags=["advisor"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
