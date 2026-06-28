from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_role
from app.models.inquiry import Inquiry, InquiryMessage
from app.models.listing import Listing
from app.models.user import User, UserRole
from app.schemas.inquiry import InquiryOut, MessageCreate, MessageOut

router = APIRouter(prefix="/inquiries")


@router.post("/{listing_id}", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
def create_inquiry(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.seeker)),
) -> InquiryOut:
    listing = db.get(Listing, listing_id)
    if not listing or listing.is_hidden or not listing.is_available:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    existing = db.execute(
        select(Inquiry).where(
            Inquiry.listing_id == listing_id,
            Inquiry.seeker_id == current_user.id,
        )
    ).scalar_one_or_none()
    if existing:
        return existing

    inquiry = Inquiry(
        listing_id=listing_id,
        seeker_id=current_user.id,
        owner_id=listing.owner_id,
        status="new",
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


@router.get("", response_model=list[InquiryOut])
def list_inquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InquiryOut]:
    statement = select(Inquiry, Listing.title).join(Listing, Listing.id == Inquiry.listing_id)
    if current_user.role == UserRole.owner:
        statement = statement.where(Inquiry.owner_id == current_user.id)
    else:
        statement = statement.where(Inquiry.seeker_id == current_user.id)

    rows = db.execute(statement.order_by(Inquiry.updated_at.desc())).all()
    inquiries: list[Inquiry] = []
    for inquiry, listing_title in rows:
        setattr(inquiry, "listing_title", listing_title)
        other_id = inquiry.seeker_id if current_user.role == UserRole.owner else inquiry.owner_id
        other = db.get(User, other_id)
        setattr(inquiry, "other_participant_name", other.full_name if other else None)
        inquiries.append(inquiry)
    return inquiries


@router.get("/{inquiry_id}/messages", response_model=list[MessageOut])
def list_messages(
    inquiry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageOut]:
    inquiry = db.get(Inquiry, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if current_user.role not in [UserRole.admin, UserRole.owner, UserRole.seeker]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if current_user.role != UserRole.admin and current_user.id not in [
        inquiry.owner_id,
        inquiry.seeker_id,
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    statement = (
        select(InquiryMessage, User.full_name)
        .join(User, User.id == InquiryMessage.sender_id)
        .where(InquiryMessage.inquiry_id == inquiry_id)
    )
    rows = db.execute(statement.order_by(InquiryMessage.created_at.asc())).all()
    messages: list[InquiryMessage] = []
    for message, sender_name in rows:
        setattr(message, "sender_name", sender_name)
        messages.append(message)
    return messages


@router.post("/{inquiry_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    inquiry_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    inquiry = db.get(Inquiry, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if current_user.role != UserRole.admin and current_user.id not in [
        inquiry.owner_id,
        inquiry.seeker_id,
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    message = InquiryMessage(
        inquiry_id=inquiry_id,
        sender_id=current_user.id,
        message_text=payload.message_text,
    )
    db.add(message)
    inquiry.status = "open"
    db.commit()
    db.refresh(message)
    return message
