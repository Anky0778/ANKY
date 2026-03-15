from pathlib import Path
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Generator
import google.generativeai as genai
from fastapi import HTTPException

from app.core.config import GEMINI_API_KEY
from app.models.chat import ChatSession, ChatMessage
from app.models.project import Project
from app.services.analytics_service import record_event
from app.services.chat_context import build_conversation_state
from app.intelligence.retriever import retrieve_context
from app.intelligence.prompt_builder import build_prompt

genai.configure(api_key=GEMINI_API_KEY)

CHAT_MODEL = "gemini-2.5-flash"
DATA_ROOT = Path("data/projects")


def create_chat_session(db: Session, project_id: UUID):
    session = ChatSession(project_id=project_id)
    db.add(session)
    db.commit()
    record_event(db, project_id, "chat_session_created")
    db.refresh(session)
    return session


def _build_context(db: Session, project_id: UUID, session_id: UUID, user_message: str):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.is_trained:
        raise HTTPException(status_code=400, detail="Project is not trained yet")

    # ✅ CHANGED: no longer check local disk for faiss.index
    # (index now lives in Supabase Storage)

    # Persist user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=user_message)
    db.add(user_msg)
    db.commit()

    # Conversation memory
    previous_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    conversation_state = build_conversation_state([
        {"role": m.role, "content": m.content} for m in previous_messages
    ])

    # ✅ CHANGED: pass str(project_id) instead of project_path
    retrieved = retrieve_context(str(project_id), user_message)

    incident_blocks = [
        {
            "incident_id": r.get("incident_id"),
            "description": r.get("description", ""),
            "long_description": r.get("long_description", ""),
            "rootcause": r.get("rootcause", ""),
            "resolution_notes": r.get("resolution_notes", ""),
        }
        for r in retrieved
        if r.get("type") == "incident" and r.get("incident_id")
    ]

    is_followup = bool(
        "Open clarification questions" in conversation_state
        and conversation_state.strip()
    )
    prompt = build_prompt(
        user_query=user_message,
        conversation=conversation_state,
        incident_blocks=incident_blocks,
        is_followup=is_followup
    )

    return prompt


def post_message(db: Session, project_id: UUID, session_id: UUID, user_message: str):
    prompt = _build_context(db, project_id, session_id, user_message)

    model = genai.GenerativeModel(model_name=CHAT_MODEL)
    response = model.generate_content(prompt)

    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=response.text
    )
    db.add(assistant_msg)
    db.commit()

    record_event(db, project_id, "chat_message_sent")
    record_event(db, project_id, "ai_call")
    return assistant_msg


def stream_message(
    db: Session,
    project_id: UUID,
    session_id: UUID,
    user_message: str
) -> Generator[str, None, None]:
    prompt = _build_context(db, project_id, session_id, user_message)

    model = genai.GenerativeModel(model_name=CHAT_MODEL)
    response = model.generate_content(prompt, stream=True)

    full_text = ""
    for chunk in response:
        token = chunk.text or ""
        if token:
            full_text += token
            yield token

    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=full_text
    )
    db.add(assistant_msg)
    db.commit()

    record_event(db, project_id, "chat_message_sent")
    record_event(db, project_id, "ai_call")