import os
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.project import Project
from app.models.incident import Incident
from app.models.document import Document
from app.models.chat import ChatSession, ChatMessage
from app.models.project import Project
import os
from supabase import create_client
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

def delete_project(db: Session, project_id: UUID):

    # Delete chat messages first
    sessions = db.query(ChatSession).filter(ChatSession.project_id == project_id).all()
    for session in sessions:
        db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete()

    # Delete everything else linked to this project
    db.query(ChatSession).filter(ChatSession.project_id == project_id).delete()
    db.query(Incident).filter(Incident.project_id == project_id).delete()
    db.query(Document).filter(Document.project_id == project_id).delete()

    # Clean up Supabase Storage
    try:
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        project_id_str = str(project_id)
        for bucket in ["documents", "faiss-indexes"]:
            try:
                files = sb.storage.from_(bucket).list(project_id_str)
                if files:
                    paths = [f"{project_id_str}/{f['name']}" for f in files]
                    sb.storage.from_(bucket).remove(paths)
            except Exception as e:
                print(f"⚠️ Could not clean bucket {bucket}: {e}")
    except Exception as e:
        print(f"⚠️ Supabase cleanup failed: {e}")

    # Finally delete the project itself
    db.query(Project).filter(Project.id == project_id).delete()
    db.commit() 