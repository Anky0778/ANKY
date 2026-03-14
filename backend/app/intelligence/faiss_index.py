import faiss
import json
import numpy as np
from pathlib import Path

def build_and_save_index(
    vectors: list[list[float]],
    metadata: list[dict],
    output_dir: Path
):
        # SAFETY CHECK: Ensure we actually have data to index
    if not vectors or len(vectors) == 0:
        print("❌ No vectors provided for indexing. Training aborted.")
        return
    # 1. Convert to proper NumPy format (Crucial for Python 3.14 / FAISS)
    # We use float32 for mathematical precision in L2 distance
    np_vectors = np.array(vectors).astype('float32')
    # Check if the array is 2D (has columns)
    if len(np_vectors.shape) < 2:
        print(f"❌ Malformed vector array. Shape: {np_vectors.shape}")
        return
    dim = np_vectors.shape[1]

    # 2. Wrap the Flat index to support IDs
    # IndexFlatL2 doesn't support add_with_ids by itself
    base_index = faiss.IndexFlatL2(dim)
    index = faiss.IndexIDMap(base_index)

    # 3. Add vectors with IDs
    # Since you passed None for IDs in your original code, we'll 
    # generate sequential ones, but using the IDMap wrapper 
    # prevents the crash you saw.
    ids = np.arange(len(vectors)).astype('int64')
    index.add_with_ids(np_vectors, ids)

    # 4. Save everything
    output_dir.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(output_dir / "faiss.index"))

    with open(output_dir / "vector_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Training saved: {index.ntotal} incidents indexed in {output_dir}")
    
    