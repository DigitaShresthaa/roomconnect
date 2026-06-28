from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

ALGORITHM = "HS256"
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return PWD_CONTEXT.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return PWD_CONTEXT.verify(plain_password, hashed_password)


def _create_token(*, subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(minutes=settings.jwt_access_ttl_minutes),
        token_type="access",
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(days=settings.jwt_refresh_ttl_days),
        token_type="refresh",
    )


def create_email_token(user_id: int) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(hours=settings.email_verification_ttl_hours),
        token_type="email",
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
