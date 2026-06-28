from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func

from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(80), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer, nullable=True)
    meta = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
