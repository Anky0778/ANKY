import faiss
import json
import numpy as np
import os
import tempfile
from pathlib import Path

from supabase import create_client
from app.intelligence.embeddings import embed_query

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "faiss-indexes"


def retrieve_context(project_id: str, query: str, k: int = 15):
    # Step 1: Download index + metadata from Supabase into a temp folder
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    with tempfile.TemporaryDirectory() as tmpdir:
        index_path = Path(tmpdir) / "faiss.index"
        meta_path = Path(tmpdir) / "vector_metadata.json"

        try:
            index_bytes = sb.storage.from_(BUCKET_NAME).download(
                f"{project_id}/faiss.index"
            )
            meta_bytes = sb.storage.from_(BUCKET_NAME).download(
                f"{project_id}/vector_metadata.json"
            )
        except Exception as e:
            raise RuntimeError(f"Project not trained yet or index missing: {e}")

        with open(index_path, "wb") as f:
            f.write(index_bytes)
        with open(meta_path, "wb") as f:
            f.write(meta_bytes)

        index = faiss.read_index(str(index_path))
        with open(meta_path, "r") as f:
            metadata = json.load(f)

    # Step 2: Everything below is IDENTICAL to your original code
    query_vector = embed_query(query)
    query_np = np.array([query_vector]).astype("float32")

    distances, indices = index.search(query_np, k)

    results = []
    seen_incidents = set()

    for idx, distance in zip(indices[0], distances[0]):
        if idx < 0 or idx >= len(metadata):
            continue

        m = metadata[idx]

        if m.get("type") != "incident":
            continue

        incident_id = m.get("incident_id")
        if not incident_id or incident_id in seen_incidents:
            continue

        seen_incidents.add(incident_id)
        m["_similarity_score"] = float(distance)
        results.append(m)

    return results