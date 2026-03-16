"""import pandas as pd
from fastapi import HTTPException

REQUIRED_COLUMNS = {
    "number",
    "description",
    "long_description",
    "rootcause",
    "resolution_notes",
}

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )
    return df

def load_incidents(file_path: str) -> pd.DataFrame:
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable file")

    if df.empty:
        raise HTTPException(status_code=400, detail="Incident file is empty")

    df = normalize_columns(df)

    incoming = set(df.columns)
    if incoming != REQUIRED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail=f"Incident file columns must be exactly {REQUIRED_COLUMNS}"
        )

    return df
"""

import pandas as pd
import io
from pathlib import Path
from fastapi import HTTPException

REQUIRED_COLUMNS = {
    "number",
    "description",
    "long_description",
    "rootcause",
    "resolution_notes",
}

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
    )
    return df

def validate_and_return(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        raise HTTPException(status_code=400, detail="Incident file is empty")

    df = normalize_columns(df)

    incoming = set(df.columns)
    missing = REQUIRED_COLUMNS - incoming

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing}. Found: {list(incoming)}"
        )

    return df[list(REQUIRED_COLUMNS)]

# ✅ New: parse from raw bytes (no filesystem needed)
def load_incidents_from_bytes(file_bytes: bytes, ext: str) -> pd.DataFrame:
    try:
        buffer = io.BytesIO(file_bytes)
        if ext == "csv":
            df = pd.read_csv(buffer, encoding="utf-8-sig")
        elif ext in {"xlsx", "xls"}:
            df = pd.read_excel(buffer)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or unreadable file: {str(e)}")

    return validate_and_return(df)

# Keep old function for backwards compatibility if used elsewhere
def load_incidents(file_path) -> pd.DataFrame:
    file_path = Path(file_path)
    ext = file_path.suffix.lower().lstrip(".")
    file_bytes = file_path.read_bytes()
    return load_incidents_from_bytes(file_bytes, ext)