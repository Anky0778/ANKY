import unicodedata
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
