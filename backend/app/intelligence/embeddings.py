import unicodedata
from fastapi import HTTPException
from sentence_transformers import SentenceTransformer
from langdetect import detect
from deep_translator import GoogleTranslator

# -----------------------------
# Model (multilingual, strong)
# -----------------------------
MODEL_NAME = "intfloat/multilingual-e5-base"
model = SentenceTransformer(MODEL_NAME)

# Translator (free, no API key)
translator = GoogleTranslator(source="auto", target="en")


# -----------------------------
# Helpers
# -----------------------------
def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).strip()


def translate_to_english(text: str) -> str:
    """
    Translate text to English if needed.
    Fails gracefully (returns original text).
    """
    try:
        lang = detect(text)
        if lang == "en":
            return text
        return translator.translate(text)
    except Exception:
        # Translation failure should NEVER block training
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
        processed_texts.append(f"passage: {t}")  # E5 requires prefix

    try:
        embeddings = model.encode(
            processed_texts,
            batch_size=64,
            show_progress_bar=True,
            convert_to_numpy=False,
            normalize_embeddings=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding failed: {e}"
        )

    if not embeddings:
        raise HTTPException(
            status_code=500,
            detail="No vectors generated — embedding failed"
        )

    print(f"✅ Embedded {len(embeddings)} chunks using {MODEL_NAME}")
    return embeddings


def embed_query(query: str) -> list[float]:
    if not query.strip():
        raise HTTPException(status_code=400, detail="Empty query")

    try:
        q = normalize_text(query)
        q = translate_to_english(q)
        vector = model.encode(
            f"query: {q}",
            convert_to_numpy=False,
            normalize_embeddings=True
        )
        return vector
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query embedding failed: {e}"
        )


#######################working well###########
"""
import unicodedata
from fastapi import HTTPException
from sentence_transformers import SentenceTransformer

# Load once at import time (important for speed)
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).strip()

def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    normalized = [normalize_text(t) for t in texts]

    try:
        # convert_to_numpy=False → FAISS-friendly Python lists
        embeddings = model.encode(
            normalized,
            batch_size=64,              # You can increase this
            show_progress_bar=True,
            convert_to_numpy=False,
            normalize_embeddings=True   # VERY IMPORTANT for cosine/L2 similarity
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Local embedding failed: {e}"
        )

    if not embeddings:
        raise HTTPException(
            status_code=500,
            detail="No vectors generated — embedding failed"
        )

    print(f"✅ Embedded {len(embeddings)} chunks using {MODEL_NAME}")
    return embeddings


def embed_query(query: str) -> list[float]:
    if not query.strip():
        raise HTTPException(status_code=400, detail="Empty query")

    try:
        normalized_query = normalize_text(query)
        vector = model.encode(
            normalized_query,
            convert_to_numpy=False,
            normalize_embeddings=True
        )
        return vector
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query embedding failed: {e}"
        )


"""

""""import time
import unicodedata
import google.generativeai as genai
from google.api_core import exceptions
from fastapi import HTTPException
from app.core.config import GEMINI_API_KEY
from sentence_transformers import SentenceTransformer
genai.configure(api_key=GEMINI_API_KEY)
import unicodedata
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text)

def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    BATCH_SIZE = 100   # SAFE for free tier
    SLEEP_SECONDS = 8  # REQUIRED

    embeddings: list[list[float]] = []

    normalized = [normalize_text(t) for t in texts]
    batches = [normalized[i:i + BATCH_SIZE] for i in range(0, len(normalized), BATCH_SIZE)]

    print(f"🚀 Embedding {len(texts)} chunks in {len(batches)} batches")

    for i, batch in enumerate(batches):
        for attempt in range(5):
            try:
                result = genai.embed_content(
                    model=MODEL_NAME,
                    content=batch,
                    task_type="retrieval_document"
                )

                batch_embeddings = result.get("embedding")
                if not batch_embeddings:
                    raise RuntimeError("Empty embedding response")

                embeddings.extend(batch_embeddings)
                print(f"✅ Batch {i+1}/{len(batches)} embedded")

                time.sleep(SLEEP_SECONDS)
                break

            except exceptions.ResourceExhausted:
                wait = (2 * attempt) * 10
                print(f"⚠️ Rate limit hit. Waiting {wait}s...")
                time.sleep(wait)

            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Embedding failed on batch {i}: {e}"
                )

    if not embeddings:
        raise HTTPException(
            status_code=500,
            detail="No vectors generated — embedding failed"
        )

    print(f"✅ Training complete: {len(embeddings)} vectors")
    return embeddings

def embed_query(query: str) -> list[float]:
    """"""Embeds a single user query (e.g., in Japanese or English).""""""
    try:
        normalized_query = normalize_text(query)
        result = genai.embed_content(
            model=MODEL_NAME,
            content=normalized_query,
            task_type="retrieval_query"
        )
        return result["embedding"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query embedding failed: {e}")
"""



############2

"""    
import time
import google.generativeai as genai
from google.api_core import exceptions
from fastapi import HTTPException

MODEL_NAME = "models/gemini-embedding-001"

def embed_texts(texts: list[str]) -> list[list[float]]:
    BATCH_SIZE = 50
    embeddings = []

    batches = [texts[i:i + BATCH_SIZE] for i in range(0, len(texts), BATCH_SIZE)]

    for batch in batches:
        for attempt in range(6):
            try:
                result = genai.embed_content(
                    model=MODEL_NAME,
                    content=batch,
                    task_type="retrieval_document"
                )
                embeddings.extend(result["embedding"])
                time.sleep(12)
                break
            except exceptions.ResourceExhausted:
                time.sleep((2 ** attempt) + 20)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Document embedding failed: {e}"
                )

    if not embeddings:
        raise HTTPException(
            status_code=500,
            detail="No document embeddings generated"
        )

    return embeddings


def embed_query(query: str) -> list[float]:
    try:
        result = genai.embed_content(
            model=MODEL_NAME,
            content=query,
            task_type="retrieval_query"
        )
        return result["embedding"]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query embedding failed: {e}"
        )
"""

