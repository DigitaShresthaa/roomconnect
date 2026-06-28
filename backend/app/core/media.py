from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


MEDIA_ROOT = Path(settings.media_root)


def ensure_listing_dir(listing_id: int) -> Path:
    listing_dir = MEDIA_ROOT / "listings" / str(listing_id)
    listing_dir.mkdir(parents=True, exist_ok=True)
    return listing_dir


def save_upload_file(listing_id: int, upload: UploadFile, content: bytes) -> str:
    listing_dir = ensure_listing_dir(listing_id)
    suffix = Path(upload.filename or "").suffix
    filename = f"{uuid4().hex}{suffix}"
    file_path = listing_dir / filename
    file_path.write_bytes(content)
    return str(file_path.as_posix())


def delete_file(path: str) -> None:
    target = Path(path)
    if target.exists():
        target.unlink()


def delete_listing_dir(listing_id: int) -> None:
    listing_dir = MEDIA_ROOT / "listings" / str(listing_id)
    if not listing_dir.exists():
        return
    try:
        listing_dir.rmdir()
    except OSError:
        return
