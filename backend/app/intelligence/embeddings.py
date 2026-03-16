import unicodedata
from fastapi import HTTPException
from sentence_transformers import SentenceTransformer
from langdetect import detect
from deep_translator import GoogleTranslator

# -----------------------------
# Model (multilingual, strong)
# -----------------------------
MODEL_NAME = "intfloat/multilingual-e5-small"
model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer(MODEL_NAME)
    return model

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
    model=get_model()
    if not texts:
        raise HTTPException(status_code=500, detail="No texts provided for embedding")

    processed_texts = []

    for t in texts:
        t = normalize_text(t)
        t = translate_to_english(t)
        processed_texts.append(f"passage: {t}")  # E5 requires prefix

    try:
        embeddings =model.encode(
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
    model=get_model()
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

