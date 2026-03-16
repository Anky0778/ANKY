import pandas as pd
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

def load_incidents(file_path) -> pd.DataFrame:
    file_path = Path(file_path)  # ✅ normalize to Path regardless of input type
    ext = file_path.suffix.lower()  # ✅ use Path.suffix instead of str.endswith

    try:
        if ext == ".csv":
            df = pd.read_csv(file_path, encoding="utf-8-sig")  # handles BOM
        elif ext in {".xlsx", ".xls"}:
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable file")

    if df.empty:
        raise HTTPException(status_code=400, detail="Incident file is empty")

    df = normalize_columns(df)

    incoming = set(df.columns)
    missing = REQUIRED_COLUMNS - incoming  # ✅ subset check, not strict equality

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing}. Found: {list(incoming)}"
        )

    return df[list(REQUIRED_COLUMNS)]  # ✅ drop any extra columns