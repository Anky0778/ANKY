def chunk_text(
    text: str,
    chunk_size: int = 800,
    overlap: int = 100
):
    words = text.split()
    chunks = []

    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        start = end - overlap

    return chunks
