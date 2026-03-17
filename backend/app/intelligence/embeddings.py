"""import unicodedata
import os
from fastapi import HTTPException
from google import genai
from langdetect import detect
from deep_translator import GoogleTranslator

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBED_MODEL = "models/text-embedding-004"  # Google's best free embedding model

client = genai.Client(api_key=GEMINI_API_KEY)
translator = GoogleTranslator(source="auto", target="en")


# -----------------------------
# Helpers (unchanged)
# -----------------------------
def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).strip()


def translate_to_english(text: str) -> str:
    try:
        lang = detect(text)
        if lang == "en":
            return text
        return translator.translate(text)
    except Exception:
        return text


# -----------------------------
# Embedding functions
# -----------------------------
def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    processed_texts = []
    for t in texts:
        t = normalize_text(t)
        t = translate_to_english(t)
        processed_texts.append(t)

    try:
        # Gemini embedding API accepts max 100 texts per batch
        # So we batch in chunks of 100
        all_vectors = []
        batch_size = 100

        for i in range(0, len(processed_texts), batch_size):
            batch = processed_texts[i : i + batch_size]
            print(f"⚙️ Embedding batch {i // batch_size + 1} ({len(batch)} texts)...")

            response = client.models.embed_content(
                model=EMBED_MODEL,
                contents=batch,
            )

            for embedding in response.embeddings:
                all_vectors.append(embedding.values)

        print(f"✅ Embedded {len(all_vectors)} chunks using {EMBED_MODEL}")
        return all_vectors

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")


def embed_query(query: str) -> list[float]:
    if not query.strip():
        raise HTTPException(status_code=400, detail="Empty query")

    try:
        q = normalize_text(query)
        q = translate_to_english(q)

        response = client.models.embed_content(
            model=EMBED_MODEL,
            contents=q,
        )

        return response.embeddings[0].values

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query embedding failed: {e}")
"""

### working but too many request 
"""import unicodedata
import os
from fastapi import HTTPException
from google import genai
from google.genai import types
from langdetect import detect
from deep_translator import GoogleTranslator

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBED_MODEL = "gemini-embedding-001"  # ✅ text-embedding-004 was deprecated Jan 14 2026

client = genai.Client(api_key=GEMINI_API_KEY)  # no http_options needed
translator = GoogleTranslator(source="auto", target="en")


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).strip()


def translate_to_english(text: str) -> str:
    try:
        lang = detect(text)
        if lang == "en":
            return text
        return translator.translate(text)
    except Exception:
        return text


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    processed_texts = []
    for t in texts:
        t = normalize_text(t)
        t = translate_to_english(t)
        processed_texts.append(t)

    try:
        all_vectors = []
        batch_size = 100

        for i in range(0, len(processed_texts), batch_size):
            batch = processed_texts[i: i + batch_size]
            print(f"⚙️ Embedding batch {i // batch_size + 1} ({len(batch)} texts)...")

            response = client.models.embed_content(
                model=EMBED_MODEL,
                contents=batch,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                )
            )

            for embedding in response.embeddings:
                all_vectors.append(embedding.values)

        print(f"✅ Embedded {len(all_vectors)} chunks using {EMBED_MODEL}")
        return all_vectors

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")


def embed_query(query: str) -> list[float]:
    if not query.strip():
        raise HTTPException(status_code=400, detail="Empty query")

    try:
        q = normalize_text(query)
        q = translate_to_english(q)

        response = client.models.embed_content(
            model=EMBED_MODEL,
            contents=q,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
            )
        )

        return response.embeddings[0].values

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query embedding failed: {e}")"""
import unicodedata
import os
import time
import requests
from fastapi import HTTPException
from langdetect import detect
from deep_translator import GoogleTranslator

HF_API_KEY = os.getenv("HF_API_KEY")
# ✅ Runs on HF servers — no memory cost on Render, free tier, 384-dim vectors
API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).strip()


def translate_to_english(text: str) -> str:
    try:
        lang = detect(text)
        if lang == "en":
            return text
        return GoogleTranslator(source="auto", target="en").translate(text)
    except Exception:
        return text


def _hf_embed(texts: list[str], attempt: int = 0) -> list[list[float]]:
    """Call HF inference API with retry on 503 (model loading)."""
    response = requests.post(
        API_URL,
        headers=HEADERS,
        json={"inputs": texts, "options": {"wait_for_model": True}},
        timeout=60,
    )

    if response.status_code == 503:
        # Model is loading on HF side — wait and retry
        if attempt < 3:
            print(f"⏳ HF model loading, waiting 20s (attempt {attempt + 1})...")
            time.sleep(20)
            return _hf_embed(texts, attempt + 1)
        raise HTTPException(status_code=503, detail="HF model unavailable after retries")

    if response.status_code == 429:
        if attempt < 4:
            wait = 30 * (attempt + 1)
            print(f"⏳ HF rate limit, waiting {wait}s...")
            time.sleep(wait)
            return _hf_embed(texts, attempt + 1)
        raise HTTPException(status_code=429, detail="HF rate limit exceeded after retries")

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"HF embedding error {response.status_code}: {response.text}"
        )

    return response.json()  # list of list of floats


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    processed = [translate_to_english(normalize_text(t)) for t in texts]

    all_vectors = []
    batch_size = 64  # HF handles up to ~100 but 64 is safer

    for i in range(0, len(processed), batch_size):
        batch = processed[i: i + batch_size]
        batch_num = i // batch_size + 1
        print(f"⚙️ Embedding batch {batch_num} ({len(batch)} texts) via HF API...")

        vectors = _hf_embed(batch)
        all_vectors.extend(vectors)

        # Small polite delay between batches
        if i + batch_size < len(processed):
            time.sleep(1)

    print(f"✅ Embedded {len(all_vectors)} chunks — dim={len(all_vectors[0])}")
    return all_vectors


def embed_query(query: str) -> list[float]:
    if not query.strip():
        raise HTTPException(status_code=400, detail="Empty query")
    try:
        q = translate_to_english(normalize_text(query))
        result = _hf_embed([q])
        return result[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query embedding failed: {e}")