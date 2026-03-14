from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.utils.auth_dependency import get_current_user
from app.services.project_service import get_project_by_id
from app.services.document_service import upload_documents
from app.schemas.upload import DocumentResponse
from fastapi import UploadFile, File
from app.services.incident_service import upload_incidents
router = APIRouter(prefix="/projects", tags=["uploads"])

@router.post(
    "/{project_id}/documents",
    response_model=list[DocumentResponse]
)
def upload_project_documents(
    project_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Ownership enforcement
    get_project_by_id(db, project_id, user.id)

    return upload_documents(db, project_id, files)

@router.post("/{project_id}/incidents")
def upload_project_incidents(
    project_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Ownership enforcement
    get_project_by_id(db, project_id, user.id)

    return upload_incidents(db, project_id, file)