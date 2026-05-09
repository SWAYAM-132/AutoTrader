from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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


@router.post("/chat/stream")
async def chat_with_advisor_stream(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Streaming chat with the AI Financial Advisor.
    Returns Server-Sent Events (SSE) for real-time token streaming.
    Requires authentication.
    """
    async def event_generator():
        async for chunk in advisor_service.analyze_stream(request.query, request.context):
            # SSE format: each event is "data: <content>\n\n"
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
