from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    id: int
    reviewer_id: int
    reviewee_id: int
    rating: int
    review_text: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReviewSummary(BaseModel):
    reviewee_id: int
    average_rating: float | None
    review_count: int
