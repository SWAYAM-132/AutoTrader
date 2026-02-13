from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.advisor import advisor_service
from app.api import deps
from app.models.user import User

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    context: str = "" # Optional client-side context

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Chat with the AI Financial Advisor.
    Requires authentication.
    """
    response = await advisor_service.analyze(request.query, request.context)
    return ChatResponse(response=response)
