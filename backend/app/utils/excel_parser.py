import pandas as pd
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
