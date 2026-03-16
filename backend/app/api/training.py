"""from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.utils.auth_dependency import get_current_user
from app.services.project_service import get_project_by_id
from app.services.training_service import train_project

router = APIRouter(prefix="/projects", tags=["training"])

@router.post("/{project_id}/train")
def train(
    project_id: UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)
    train_project(db, project_id)
    return {"status": "trained"}
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import json

from app.core.database import get_db
from app.utils.auth_dependency import get_current_user
from app.services.project_service import get_project_by_id
from app.services.training_service import train_project_stream

router = APIRouter(prefix="/projects", tags=["training"])


@router.post("/{project_id}/train")
def train(
    project_id: UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)

    def event_stream():
        for event in train_project_stream(db, project_id):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

