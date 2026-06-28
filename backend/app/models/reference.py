from sqlalchemy import Boolean, Column, DateTime, ForeignKey, BigInteger, String
from sqlalchemy.sql import func

from app.db.session import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(80), nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class Province(Base):
    __tablename__ = "provinces"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(80), nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class District(Base):
    __tablename__ = "districts"

    id = Column(BigInteger, primary_key=True, index=True)
    province_id = Column(BigInteger, ForeignKey("provinces.id"), nullable=False)
    name = Column(String(80), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class Locality(Base):
    __tablename__ = "localities"

    id = Column(BigInteger, primary_key=True, index=True)
    district_id = Column(BigInteger, ForeignKey("districts.id"), nullable=False)
    name = Column(String(120), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
