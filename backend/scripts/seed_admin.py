import os
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def seed_admin() -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME")
    admin_phone = os.getenv("ADMIN_PHONE")
    reset_password = os.getenv("ADMIN_RESET_PASSWORD", "false").lower() in {
        "1",
        "true",
        "yes",
    }

    if not admin_email:
        raise SystemExit("ADMIN_EMAIL is required")

    with SessionLocal() as session:
        user_by_email = session.execute(
            select(User).where(User.email == admin_email)
        ).scalar_one_or_none()

        user = user_by_email
        if not user and admin_phone:
            user = session.execute(
                select(User).where(User.phone == admin_phone)
            ).scalar_one_or_none()

        if user:
            changed = False
            if user.role != UserRole.admin:
                user.role = UserRole.admin
                changed = True
            if not user.is_active:
                user.is_active = True
                changed = True
            if not user.is_verified:
                user.is_verified = True
                changed = True
            if reset_password:
                if not admin_password:
                    raise SystemExit("ADMIN_PASSWORD is required to reset the password")
                if len(admin_password) > 72:
                    raise SystemExit("ADMIN_PASSWORD must be 72 characters or fewer")
                user.password_hash = hash_password(admin_password)
                changed = True

            if changed:
                user.updated_at = datetime.now(timezone.utc)
                session.commit()
                print("Admin user updated")
            else:
                print("Admin user already up to date")
            return

        if not admin_password:
            raise SystemExit("ADMIN_PASSWORD is required to create the admin user")
        if not admin_name:
            raise SystemExit("ADMIN_NAME is required to create the admin user")
        if not admin_phone:
            raise SystemExit("ADMIN_PHONE is required to create the admin user")
        if len(admin_password) > 72:
            raise SystemExit("ADMIN_PASSWORD must be 72 characters or fewer")

        user = User(
            role=UserRole.admin,
            full_name=admin_name,
            email=admin_email,
            phone=admin_phone,
            password_hash=hash_password(admin_password),
            is_verified=True,
            is_active=True,
            last_login_at=None,
        )
        session.add(user)
        session.commit()
        print("Admin user created")


if __name__ == "__main__":
    if not settings.db_name:
        raise SystemExit("Database not configured")
    seed_admin()
