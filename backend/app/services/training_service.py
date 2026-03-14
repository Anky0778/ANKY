from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from uuid import UUID
from tqdm import tqdm
from fastapi import HTTPException
from app.services.analytics_service import record_event
from app.intelligence.text_extractors import extract_text_from_file
from app.intelligence.chunking import chunk_text
from app.intelligence.embeddings import embed_texts
from app.intelligence.faiss_index import build_and_save_index
from app.models.project import Project

DATA_ROOT = Path("data/projects")

def train_project(db: Session, project_id: UUID):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    base_path = DATA_ROOT / str(project_id)

    docs_path = base_path / "documents"
    incidents_file = base_path / "incidents" / "incidents.parquet"

    if not docs_path.exists() or not any(docs_path.iterdir()):
        raise HTTPException(
            status_code=400,
            detail="No SOP documents uploaded"
        )

    if not incidents_file.exists():
        raise HTTPException(
            status_code=400,
            detail="Incident data not uploaded"
        )

    all_chunks = []
    metadata = []

    # SOPs
    for file in docs_path.iterdir():
        print(f"📄 Processing document: {file.name}...")
        try:
            text = extract_text_from_file(file)
            if not text.strip():
                print(f"⚠️ Warning: {file.name} is empty.")
                continue

            chunks = chunk_text(text)
            print(f"✂️ Created {len(chunks)} chunks from {file.name}")
            
            for chunk in chunks:
                all_chunks.append(chunk)
                metadata.append({
                    "type": "sop",
                    "filename": file.name
                })
        except Exception as e:
            print(f"❌ Failed to parse {file.name}: {e}")

    # Incidents
    print(f"📊 Loading {incidents_file.name} into memory...")
    df = pd.read_parquet(incidents_file)
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

    # Embeddings
    vectors = embed_texts(all_chunks)

    intelligence_path = base_path / "intelligence"
    build_and_save_index(vectors, metadata, intelligence_path)

    project.is_trained = True
    db.commit()