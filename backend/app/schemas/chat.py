from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ChatSessionResponse(BaseModel):
    id: UUID
    created_at: datetime

class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime
