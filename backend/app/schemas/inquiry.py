from datetime import datetime

from pydantic import BaseModel


class InquiryOut(BaseModel):
    id: int
    listing_id: int
    listing_title: str | None = None
    seeker_id: int
    owner_id: int
    other_participant_name: str | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    message_text: str


class MessageOut(BaseModel):
    id: int
    inquiry_id: int
    sender_id: int
    sender_name: str | None = None
    message_text: str
    created_at: datetime

    class Config:
        from_attributes = True
