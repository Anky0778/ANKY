import os
import io
from sqlalchemy.orm import Session
from uuid import UUID
from supabase import create_client

from app.models.document import Document
from app.utils.file_utils import validate_document
from app.services.analytics_service import record_event

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DOCS_BUCKET = "documents"


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_documents(db: Session, project_id: UUID, files: list):
    sb = get_supabase()
    saved_docs = []

    for file in files:
        ext = validate_document(file)

        file_bytes = file.file.read()

        # Upload to Supabase Storage: documents/{project_id}/documents/{filename}
        sb.storage.from_(DOCS_BUCKET).upload(
            f"{project_id}/documents/{file.filename}",
            file_bytes,
            {"upsert": "true", "content-type": file.content_type or "application/octet-stream"}
        )

        doc = Document(
            project_id=project_id,
            filename=file.filename,
            file_type=ext
        )
        db.add(doc)
        saved_docs.append(doc)

    db.commit()
    record_event(db, project_id, "document_upload", {"count": len(saved_docs)})
    return saved_docs