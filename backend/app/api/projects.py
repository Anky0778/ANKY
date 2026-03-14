from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.schemas.project import ProjectCreateRequest, ProjectResponse
from app.core.database import get_db
from app.utils.auth_dependency import get_current_user
from app.services.project_service import (
    create_project,
    get_user_projects,
    get_project_by_id
)

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse)
def create(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return create_project(
        db=db,
        owner_id=user.id,
        name=payload.name,
        description=payload.description
    )

@router.get("", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return get_user_projects(db, user.id)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return get_project_by_id(db, project_id, user.id)
