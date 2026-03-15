import os
import io
import tempfile
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import UploadFile, HTTPException
from supabase import create_client

from app.services.analytics_service import record_event
from app.models.incident import Incident
from app.utils.excel_parser import load_incidents

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DOCS_BUCKET = "documents"


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_incidents(db: Session, project_id: UUID, file: UploadFile):
    ext = file.filename.split(".")[-1].lower()
    if ext not in {"xlsx", "xls", "csv"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_bytes = file.file.read()

    # Write to temp file so load_incidents (which expects a path) can read it
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = Path(tmp.name)

    try:
        df = load_incidents(tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)  # always clean up

    # Clear existing incidents
    db.query(Incident).filter(Incident.project_id == project_id).delete()

    # Insert into DB
    records = []
    for _, row in df.iterrows():
        incident = Incident(
            project_id=project_id,
            number=str(row["number"]),
            description=row["description"],
            long_description=row["long_description"],
            rootcause=row["rootcause"],
            resolution_notes=row["resolution_notes"],
        )
        db.add(incident)
        records.append(incident)

    db.commit()

    # Convert to parquet bytes and upload to Supabase Storage
    # training_service.py will download this later during training
    parquet_buffer = io.BytesIO()
    df.to_parquet(parquet_buffer, index=False)
    parquet_bytes = parquet_buffer.getvalue()

    sb = get_supabase()
    sb.storage.from_(DOCS_BUCKET).upload(
        f"{project_id}/incidents/incidents.parquet",
        parquet_bytes,
        {"upsert": "true", "content-type": "application/octet-stream"}
    )

    record_event(db, project_id, "incident_upload", {"count": len(records)})
    return {"incident_count": len(records)}