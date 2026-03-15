import faiss
import json
import numpy as np
import os
import tempfile
from pathlib import Path
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "faiss-indexes"  # create this bucket in Supabase Storage

def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def build_and_save_index(
    vectors: list[list[float]],
    metadata: list[dict],
    project_id: str,          # ← pass project_id so each project has its own index
):
    if not vectors:
        print("❌ No vectors provided.")
        return

    np_vectors = np.array(vectors).astype('float32')
    if len(np_vectors.shape) < 2:
        print(f"❌ Malformed vector array. Shape: {np_vectors.shape}")
        return

    dim = np_vectors.shape[1]
    base_index = faiss.IndexFlatL2(dim)
    index = faiss.IndexIDMap(base_index)
    ids = np.arange(len(vectors)).astype('int64')
    index.add_with_ids(np_vectors, ids)

    # Save to a temp dir then upload to Supabase
    with tempfile.TemporaryDirectory() as tmpdir:
        index_path = Path(tmpdir) / "faiss.index"
        meta_path = Path(tmpdir) / "vector_metadata.json"

        faiss.write_index(index, str(index_path))
        with open(meta_path, "w") as f:
            json.dump(metadata, f)

        sb = get_supabase()

        # Upload index file
        with open(index_path, "rb") as f:
            sb.storage.from_(BUCKET_NAME).upload(
                f"{project_id}/faiss.index",
                f.read(),
                {"upsert": "true"}
            )

        # Upload metadata file
        with open(meta_path, "rb") as f:
            sb.storage.from_(BUCKET_NAME).upload(
                f"{project_id}/vector_metadata.json",
                f.read(),
                {"upsert": "true"}
            )

    print(f"✅ Index uploaded to Supabase Storage: {project_id}/")


def load_index(project_id: str):
    """Load FAISS index from Supabase Storage into memory."""
    sb = get_supabase()

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
            print(f"❌ Could not load index for project {project_id}: {e}")
            return None, []

        with open(index_path, "wb") as f:
            f.write(index_bytes)
        with open(meta_path, "wb") as f:
            f.write(meta_bytes)

        index = faiss.read_index(str(index_path))
        with open(meta_path, "r") as f:
            metadata = json.load(f)

    print(f"✅ Index loaded from Supabase: {index.ntotal} vectors")
    return index, metadata