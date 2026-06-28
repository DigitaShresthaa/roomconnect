from sqlalchemy import Column, DateTime, ForeignKey, BigInteger, SmallInteger, Text
from sqlalchemy.sql import func

from app.db.session import Base


class UserReview(Base):
    __tablename__ = "user_reviews"

    id = Column(BigInteger, primary_key=True, index=True)
    reviewer_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    rating = Column(SmallInteger, nullable=False)
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
