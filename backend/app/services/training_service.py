import os
import io
import tempfile
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session
from uuid import UUID
from tqdm import tqdm
from fastapi import HTTPException
from supabase import create_client

from app.services.analytics_service import record_event
from app.intelligence.text_extractors import extract_text_from_file
from app.intelligence.chunking import chunk_text
from app.intelligence.embeddings import embed_texts
from app.intelligence.faiss_index import build_and_save_index
from app.models.project import Project

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DOCS_BUCKET = "documents"       # your existing bucket for uploaded SOPs/incidents
DATA_ROOT = Path("data/projects")  # kept only as fallback for local dev


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def train_project(db: Session, project_id: UUID):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    sb = get_supabase()
    project_id_str = str(project_id)

    all_chunks = []
    metadata = []

    # ── SOPs ──────────────────────────────────────────────────────────────────
    # List all files under {project_id}/documents/ in Supabase Storage
    try:
        sop_files = sb.storage.from_(DOCS_BUCKET).list(f"{project_id_str}/documents")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not list SOP documents: {e}")

    if not sop_files:
        raise HTTPException(status_code=400, detail="No SOP documents uploaded")

    for file_info in sop_files:
        filename = file_info["name"]
        print(f"📄 Processing document: {filename}...")

        try:
            file_bytes = sb.storage.from_(DOCS_BUCKET).download(
                f"{project_id_str}/documents/{filename}"
            )
        except Exception as e:
            print(f"❌ Could not download {filename}: {e}")
            continue

        # Write to temp file so extract_text_from_file can read it normally
        with tempfile.NamedTemporaryFile(suffix=Path(filename).suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = Path(tmp.name)

        try:
            text = extract_text_from_file(tmp_path)
            if not text.strip():
                print(f"⚠️ Warning: {filename} is empty.")
                continue

            chunks = chunk_text(text)
            print(f"✂️ Created {len(chunks)} chunks from {filename}")

            for chunk in chunks:
                all_chunks.append(chunk)
                metadata.append({
                    "type": "sop",
                    "filename": filename
                })
        except Exception as e:
            print(f"❌ Failed to parse {filename}: {e}")
        finally:
            tmp_path.unlink(missing_ok=True)  # clean up temp file

    # ── Incidents ─────────────────────────────────────────────────────────────
    try:
        incidents_bytes = sb.storage.from_(DOCS_BUCKET).download(
            f"{project_id_str}/incidents/incidents.parquet"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Incident data not uploaded: {e}")

    print("📊 Loading incidents into memory...")
    df = pd.read_parquet(io.BytesIO(incidents_bytes))
    total_incidents = len(df)
    print(f"✅ Found {total_incidents} incidents. Starting chunking...")

    for _, row in tqdm(df.iterrows(), total=total_incidents, desc="Processing Incidents"):
        incident_text = f"""
Incident Number: {row['number']}
Description: {row['description']}
Long Description: {row['long_description']}
Root Cause: {row['rootcause']}
Resolution: {row['resolution_notes']}
"""
        chunks = chunk_text(incident_text)

        for chunk in chunks:
            all_chunks.append(chunk)
            metadata.append({
                "type": "incident",
                "incident_id": row["number"],
                "description": row["description"],
                "long_description": row["long_description"],
                "rootcause": row["rootcause"],
                "resolution_notes": row["resolution_notes"]
            })

    if not all_chunks:
        raise HTTPException(
            status_code=500,
            detail="No text chunks generated for training"
        )

    # ── Embeddings + Index ────────────────────────────────────────────────────
    vectors = embed_texts(all_chunks)

    # ✅ CHANGED: pass project_id_str instead of local intelligence_path
    build_and_save_index(vectors, metadata, project_id_str)

    project.is_trained = True
    db.commit()