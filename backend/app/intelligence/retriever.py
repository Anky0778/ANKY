"""import faiss
import json
from pathlib import Path
import google.generativeai as genai
from app.core.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
EMBED_MODEL = "models/embedding-001"

def embed_query(query: str) -> list[float]:
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=query
    )
    return result["embedding"]

def retrieve_context(project_path: Path, query: str, k: int = 8):
    index = faiss.read_index(str(project_path / "intelligence" / "faiss.index"))

    with open(project_path / "intelligence" / "vector_metadata.json") as f:
        metadata = json.load(f)

    query_vector = embed_query(query)

    distances, indices = index.search(
        faiss.vector_to_array([query_vector]),
        k
    )

    contexts = []
    for idx in indices[0]:
        if idx == -1:
            continue
        contexts.append(metadata[idx])

    return contexts
"""

import faiss
import json
import numpy as np
from pathlib import Path
from fastapi import HTTPException

from app.intelligence.embeddings import embed_query


def retrieve_context(project_path, query, k=15):
    index_path = project_path / "intelligence" / "faiss.index"
    meta_path = project_path / "intelligence" / "vector_metadata.json"

    index = faiss.read_index(str(index_path))

    with open(meta_path) as f:
        metadata = json.load(f)

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

""""def retrieve_context(project_path, query, k=12):
    index_path = project_path / "intelligence" / "faiss.index"
    meta_path = project_path / "intelligence" / "vector_metadata.json"

    index = faiss.read_index(str(index_path))

    with open(meta_path) as f:
        metadata = json.load(f)

    query_vector = embed_query(query)
    query_np = np.array([query_vector]).astype("float32")

    distances, indices = index.search(query_np, k)

    # 1️⃣ Primary semantic results
    semantic_results = []
    for idx in indices[0]:
        if 0 <= idx < len(metadata):
            semantic_results.append(metadata[idx])
            
    incident_results = [
    metadata[idx]
    for idx in indices[0]
    if 0 <= idx < len(metadata)
    and metadata[idx].get("type") == "incident"
]   
    MAX_INCIDENTS_IN_PROMPT = 5

    incident_results = incident_results[:MAX_INCIDENTS_IN_PROMPT]
    # 2️⃣ Ensure incidents are included (CRITICAL FIX)
    incident_results = [
        m for m in metadata
        if m.get("type") == "incident"
    ][:5]
    
    # 3️⃣ Merge, deduplicate
    seen = set()
    merged = []

    for item in semantic_results + incident_results:
        key = (item.get("type"), item.get("incident_id"))
        if key not in seen:
            seen.add(key)
            merged.append(item)

    return merged
##############################
def retrieve_context(
    project_path: Path,
    query: str,
    k: int = 8
):
    index_path = project_path / "intelligence" / "faiss.index"
    meta_path = project_path / "intelligence" / "vector_metadata.json"

    if not index_path.exists() or not meta_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Project is not trained yet"
        )

    index = faiss.read_index(str(index_path))

    with open(meta_path) as f:
        metadata = json.load(f)

    query_vector = embed_query(query)
    query_np = np.array([query_vector]).astype("float32")

    distances, indices = index.search(query_np, k)

    results = []

    for idx in indices[0]:
        if idx < 0 or idx >= len(metadata):
            continue

    item = metadata[idx]

    # 🔒 HARD GUARANTEE required fields survive
    if isinstance(item, dict):
        results.append(item)
    else:
        raise RuntimeError(f"Invalid metadata entry: {item}")

    return results
"""