from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class PortfolioItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    symbol: str
    quantity: float
    avg_cost: float


# ---------- API Schemas ----------

class PortfolioCreate(BaseModel):
    """Schema for creating a new portfolio item (client-facing)."""
    symbol: str
    quantity: float
    avg_cost: float


class PortfolioRead(BaseModel):
    """Schema for returning portfolio data with real-time enrichments."""
    id: int
    symbol: str
    quantity: float
    avg_cost: float
    current_price: float = 0.0
    value: float = 0.0
    pnl: float = 0.0
    pnl_percent: float = 0.0
