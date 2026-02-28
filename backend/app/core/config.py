from typing import List

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoTraderX"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Database
    POSTGRES_USER: str = "user"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "autotraderx"
    DATABASE_URL: str = ""

    @model_validator(mode="after")
    def assemble_db_url(self) -> "Settings":
        """Build DATABASE_URL from components if not explicitly set via env."""
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        return self

    # ChromaDB (Vector Store for RAG)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # AI / LLM
    LLM_PROVIDER: str = "groq"  # "groq" or "huggingface"
    GROQ_API_KEY: str = ""
    HF_TOKEN: str = ""
    HF_FINE_TUNED_MODEL: str = "Swayam132/autotraderx-qlora-adapter"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
