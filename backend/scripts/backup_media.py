import os
from datetime import datetime
from pathlib import Path
import zipfile

from app.core.config import settings


def backup_media() -> None:
    media_root = Path(settings.media_root)
    if not media_root.exists():
        raise SystemExit("Media directory not found")

    backup_dir = Path(os.getenv("BACKUP_DIR", "backups"))
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = backup_dir / f"media_backup_{timestamp}.zip"

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as handle:
        for path in media_root.rglob("*"):
            if path.is_file():
                handle.write(path, path.relative_to(media_root.parent))

    print(f"Media backup created: {archive_path}")


if __name__ == "__main__":
    backup_media()
