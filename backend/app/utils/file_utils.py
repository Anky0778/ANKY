import os
from fastapi import HTTPException, UploadFile

ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "txt"}

def validate_document(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a name")

    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}"
        )
    return ext

def save_file(file: UploadFile, destination: str):
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    with open(destination, "wb") as f:
        f.write(file.file.read())
