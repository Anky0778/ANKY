from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    file_type: str
    uploaded_at: datetime
