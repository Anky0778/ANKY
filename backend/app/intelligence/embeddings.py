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
from fastapi import HTTPException
from google import genai
from google.genai import types
from langdetect import detect
from deep_translator import GoogleTranslator

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBED_MODEL = "gemini-embedding-001"

client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(api_version="v1")
)
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


def embed_batch_with_retry(batch: list[str], batch_num: int, max_retries: int = 5) -> list:
    """Embed a single batch with exponential backoff on 429s."""
    delay = 10  # start with 10s wait

    for attempt in range(max_retries):
        try:
            response = client.models.embed_content(
                model=EMBED_MODEL,
                contents=batch,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                )
            )
            return [embedding.values for embedding in response.embeddings]

        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                if attempt < max_retries - 1:
                    print(f"⏳ Rate limited on batch {batch_num}, waiting {delay}s (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(delay)
                    delay *= 2  # exponential backoff: 10 → 20 → 40 → 80 → 160
                else:
                    raise HTTPException(status_code=429, detail=f"Embedding rate limit exceeded after {max_retries} retries.")
            else:
                raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    return []


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    processed_texts = []
    for t in texts:
        t = normalize_text(t)
        t = translate_to_english(t)
        processed_texts.append(t)

    all_vectors = []
    batch_size = 100

    for i in range(0, len(processed_texts), batch_size):
        batch = processed_texts[i: i + batch_size]
        batch_num = i // batch_size + 1
        print(f"⚙️ Embedding batch {batch_num} ({len(batch)} texts)...")

        vectors = embed_batch_with_retry(batch, batch_num)
        all_vectors.extend(vectors)

        # ✅ Polite delay between batches to avoid hitting RPM
        if i + batch_size < len(processed_texts):
            print(f"💤 Waiting 12s before next batch to respect rate limits...")
            time.sleep(12)

    print(f"✅ Embedded {len(all_vectors)} chunks using {EMBED_MODEL}")
    return all_vectors


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
        raise HTTPException(status_code=500, detail=f"Query embedding failed: {e}")