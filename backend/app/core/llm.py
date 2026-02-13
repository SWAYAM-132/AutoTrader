from langchain_groq import ChatGroq
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_llm() -> ChatGroq:
    """
    Returns a configured ChatGroq instance.
    Uses Llama 3 70B by default for high-quality financial reasoning.
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not found in settings. LLM calls will fail.")
        
    return ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile",
        groq_api_key=settings.GROQ_API_KEY or "placeholder"
    )
