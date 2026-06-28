from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record_audit(
    db: Session,
    *,
    admin_id: int,
    action: str,
    target_type: str,
    target_id: int | None,
    metadata: dict[str, Any] | None = None,
) -> None:
    log = AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        meta=metadata,
    )
    db.add(log)
