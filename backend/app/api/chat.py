from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.utils.auth_dependency import get_current_user
from app.services.project_service import get_project_by_id
from app.services.chat_service import (
    create_chat_session,
    post_message,
    stream_message
)
from app.schemas.chat import (
    ChatSessionResponse,
    ChatMessageRequest,
    ChatMessageResponse
)

router = APIRouter(prefix="/projects", tags=["chat"])


@router.post("/{project_id}/chat/sessions", response_model=ChatSessionResponse)
def start_session(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)
    return create_chat_session(db, project_id)


@router.post(
    "/{project_id}/chat/sessions/{session_id}/messages",
    response_model=ChatMessageResponse
)
def send_message(
    project_id: UUID,
    session_id: UUID,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)
    return post_message(db, project_id, session_id, payload.message)


@router.post(
    "/{project_id}/chat/sessions/{session_id}/messages/stream"
)
def send_message_stream(
    project_id: UUID,
    session_id: UUID,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)
    return StreamingResponse(
        stream_message(db, project_id, session_id, payload.message),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )
