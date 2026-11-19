import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOC_EXTS = {".pdf", ".doc", ".docx", ".jpg", ".png"}

@router.post("/photo")
async def upload_photo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid photo extension '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTS)}"
        )

    file_id = f"photo_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, "photos", file_id)

    with open(dest_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "url": f"/uploads/photos/{file_id}",
        "filename": file.filename,
        "size_bytes": len(content)
    }

@router.post("/document")
async def upload_document(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_DOC_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document extension '{ext}'. Allowed: {', '.join(ALLOWED_DOC_EXTS)}"
        )

    file_id = f"doc_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, "documents", file_id)

    with open(dest_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "url": f"/uploads/documents/{file_id}",
        "filename": file.filename,
        "size_bytes": len(content)
    }
