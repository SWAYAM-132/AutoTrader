from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User, UserCreate, UserRead, Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    result = await session.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            {"sub": user.email}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=UserRead)
async def create_user(
    *,
    session: AsyncSession = Depends(get_session),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    result = await session.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    db_obj = User.model_validate(
        user_in.model_dump(exclude={"password"}),
        update={"hashed_password": hashed_password}
    )
    
    session.add(db_obj)
    try:
        await session.commit()
        await session.refresh(db_obj)
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return db_obj
