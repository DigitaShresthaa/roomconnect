from sqlalchemy import Column, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func

from app.db.session import Base


class SavedListing(Base):
    __tablename__ = "saved_listings"

    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    listing_id = Column(BigInteger, ForeignKey("listings.id"), primary_key=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
