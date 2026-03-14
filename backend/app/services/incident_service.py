import os
import pandas as pd
from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import UploadFile, HTTPException
from app.services.analytics_service import record_event
from app.models.incident import Incident
from app.utils.excel_parser import load_incidents

DATA_ROOT = "data/projects"

def upload_incidents(
    db: Session,
    project_id: UUID,
    file: UploadFile
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in {"xlsx", "xls", "csv"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    incident_dir = f"{DATA_ROOT}/{project_id}/incidents"
    os.makedirs(incident_dir, exist_ok=True)

    raw_path = f"{incident_dir}/raw.{ext}"
    parquet_path = f"{incident_dir}/incidents.parquet"

    # Save uploaded file
    with open(raw_path, "wb") as f:
        f.write(file.file.read())

    # Parse & validate
    df = load_incidents(raw_path)

    # Clear existing incidents (explicit overwrite rule)
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
    record_event(
    db,
    project_id,
    "incident_upload",
    {"count": len(records)}
)
    # Persist parquet (training source of truth)
    df.to_parquet(parquet_path, index=False)

    return {
        "incident_count": len(records)
    }
