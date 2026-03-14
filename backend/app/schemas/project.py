from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProjectCreateRequest(BaseModel):
    name: str
    description: str | None = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_trained: bool
    created_at: datetime
