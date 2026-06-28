from datetime import datetime, timezone
import time

from fastapi import APIRouter

router = APIRouter()

STARTED_AT = datetime.now(timezone.utc)
STARTED_AT_TS = time.monotonic()


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@router.get("/health/uptime")
def uptime() -> dict:
    uptime_seconds = time.monotonic() - STARTED_AT_TS
    return {
        "status": "ok",
        "started_at": STARTED_AT.isoformat(),
        "uptime_seconds": round(uptime_seconds, 2),
    }
