import logging
from typing import Optional

from langchain_groq import ChatGroq
from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import settings

logger = logging.getLogger(__name__)

_hf_llm = None
_groq_llm = None


def _get_hf_llm():
    """
    Load the fine-tuned model from HuggingFace via Inference API.
    Uses Swayam132/autotraderx-qlora-adapter (merged model).
    No GPU needed — runs on HF's infrastructure.
    """
    global _hf_llm
    if _hf_llm is not None:
        return _hf_llm

    try:
        from langchain_huggingface import HuggingFaceEndpoint

        _hf_llm = HuggingFaceEndpoint(
            repo_id=settings.HF_FINE_TUNED_MODEL,
            huggingfacehub_api_token=settings.HF_TOKEN,
            task="text-generation",
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.15,
        )
        logger.info(
            "Loaded HuggingFace model: %s", settings.HF_FINE_TUNED_MODEL,
        )
        return _hf_llm

    except ImportError:
        logger.warning(
            "langchain-huggingface not installed, falling back to Groq. "
            "Install with: pip install langchain-huggingface"
        )
        return _get_groq_llm()
    except Exception as e:
        logger.warning(
            "Failed to load HuggingFace model (%s), falling back to Groq: %s",
            settings.HF_FINE_TUNED_MODEL, e,
        )
        return _get_groq_llm()


def _get_groq_llm() -> ChatGroq:
    """Returns a cached, configured ChatGroq instance (Llama 3.3 70B via Groq API)."""
    global _groq_llm
    if _groq_llm is not None:
        return _groq_llm

    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not found in settings. LLM calls will fail.")

    _groq_llm = ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile",
        groq_api_key=settings.GROQ_API_KEY or "placeholder",
    )
    return _groq_llm


def get_llm():
    """
    Returns the configured LLM based on LLM_PROVIDER setting.

    - "groq"        → Groq API (Llama 3.3 70B, fast, cloud)
    - "huggingface"  → HuggingFace Inference API (fine-tuned model)

    Set LLM_PROVIDER in .env to switch between them.
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "huggingface":
        if not settings.HF_TOKEN:
            logger.warning(
                "HF_TOKEN not set — falling back to Groq. "
                "Set HF_TOKEN in .env to use your fine-tuned model."
            )
            return _get_groq_llm()
        return _get_hf_llm()
    else:
        return _get_groq_llm()
