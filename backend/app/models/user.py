import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, BigInteger, String
from sqlalchemy.sql import func

from app.db.session import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    owner = "owner"
    seeker = "seeker"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    role = Column(Enum(UserRole, native_enum=False), nullable=False)
    full_name = Column(String(120), nullable=False)
    email = Column(String(254), nullable=False, unique=True)
    phone = Column(String(32), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)

    is_verified = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    last_login_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
