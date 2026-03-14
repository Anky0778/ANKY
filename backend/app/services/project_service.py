import os
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.project import Project

DATA_ROOT = "data/projects"

def create_project(
    db: Session,
    owner_id: UUID,
    name: str,
    description: str | None
):
    project = Project(
        name=name,
        description=description,
        owner_id=owner_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create filesystem structure
    base_path = f"{DATA_ROOT}/{project.id}"
    os.makedirs(f"{base_path}/documents", exist_ok=True)
    os.makedirs(f"{base_path}/incidents", exist_ok=True)
    os.makedirs(f"{base_path}/intelligence", exist_ok=True)

    return project
def get_user_projects(db: Session, owner_id: UUID):
    return db.query(Project).filter(Project.owner_id == owner_id).all()

def get_project_by_id(db: Session, project_id: UUID, owner_id: UUID):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == owner_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
