import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, BigInteger, Text
from sqlalchemy.sql import func

from app.db.session import Base


class InquiryStatus(str, enum.Enum):
    new = "new"
    open = "open"
    closed = "closed"


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(BigInteger, primary_key=True, index=True)
    listing_id = Column(BigInteger, ForeignKey("listings.id"), nullable=False)
    seeker_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(InquiryStatus, native_enum=False), nullable=False, default=InquiryStatus.new)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class InquiryMessage(Base):
    __tablename__ = "inquiry_messages"

    id = Column(BigInteger, primary_key=True, index=True)
    inquiry_id = Column(BigInteger, ForeignKey("inquiries.id"), nullable=False)
    sender_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
