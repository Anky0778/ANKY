import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    number = Column(String, nullable=False)
    description = Column(String, nullable=False)
    long_description = Column(String, nullable=False)
    rootcause = Column(String, nullable=False)
    resolution_notes = Column(String, nullable=False)
