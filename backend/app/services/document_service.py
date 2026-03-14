import os
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.document import Document
from app.utils.file_utils import validate_document, save_file
from app.services.analytics_service import record_event
DATA_ROOT = "data/projects"

def upload_documents(
    db: Session,
    project_id: UUID,
    files: list
):
    saved_docs = []

    for file in files:
        ext = validate_document(file)

        destination = (
            f"{DATA_ROOT}/{project_id}/documents/{file.filename}"
        )

        save_file(file, destination)

        doc = Document(
            project_id=project_id,
            filename=file.filename,
            file_type=ext
        )
        db.add(doc)
        saved_docs.append(doc)

    db.commit()
    record_event(
    db,
    project_id,
    "document_upload",
    {"count": len(saved_docs)}
)
    return saved_docs
