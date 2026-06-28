from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_db, require_role
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.admin import UserAdminUpdate
from app.schemas.audit import AuditLogOut
from app.schemas.user import UserPublic

router = APIRouter(prefix="/admin")
admin_only = Depends(require_role(UserRole.admin))


@router.get("/users", response_model=list[UserPublic], dependencies=[admin_only])
def list_users(
    db: Session = Depends(get_db),
    role: str | None = None,
    is_active: bool | None = None,
    is_verified: bool | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[UserPublic]:
    filters = []
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    if is_verified is not None:
        filters.append(User.is_verified == is_verified)
    if q:
        like = f"%{q}%"
        filters.append(or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like)))

    statement = (
        select(User)
        .where(and_(*filters))
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.execute(statement).scalars())


@router.patch(
    "/users/{user_id}",
    response_model=UserPublic,
    dependencies=[admin_only],
)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> UserPublic:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    updates = {}
    if payload.is_active is not None:
        user.is_active = payload.is_active
        updates["is_active"] = payload.is_active
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
        updates["is_verified"] = payload.is_verified
    if payload.role is not None:
        try:
            new_role = UserRole(payload.role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        user.role = new_role
        updates["role"] = new_role.value

    if not updates:
        return user

    record_audit(
        db,
        admin_id=current_user.id,
        action="user_update",
        target_type="user",
        target_id=user.id,
        metadata=updates,
    )

    db.commit()
    db.refresh(user)
    return user


@router.get("/audit-logs", response_model=list[AuditLogOut], dependencies=[admin_only])
def list_audit_logs(
    db: Session = Depends(get_db),
    admin_id: int | None = None,
    target_type: str | None = None,
    target_id: int | None = None,
    action: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[AuditLogOut]:
    filters = []
    if admin_id is not None:
        filters.append(AuditLog.admin_id == admin_id)
    if target_type:
        filters.append(AuditLog.target_type == target_type)
    if target_id is not None:
        filters.append(AuditLog.target_id == target_id)
    if action:
        filters.append(AuditLog.action == action)

    statement = (
        select(AuditLog)
        .where(and_(*filters))
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.execute(statement).scalars())
