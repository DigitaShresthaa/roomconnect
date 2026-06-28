from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_role
from app.models.listing import Listing, ListingMedia
from app.models.saved import SavedListing
from app.models.user import User, UserRole
from app.schemas.listing import ListingOut

router = APIRouter(prefix="/saved")


def _attach_cover_images(db: Session, listings: list[Listing]) -> None:
    if not listings:
        return

    listing_ids = [listing.id for listing in listings]
    media_rows = db.execute(
        select(ListingMedia)
        .where(ListingMedia.listing_id.in_(listing_ids))
        .order_by(ListingMedia.listing_id.asc(), ListingMedia.sort_order.asc())
    ).scalars().all()

    cover_by_listing_id: dict[int, str] = {}
    for media in media_rows:
        media_type = getattr(media.media_type, "value", media.media_type)
        if media_type != "image":
            continue
        cover_by_listing_id.setdefault(media.listing_id, media.file_path)

    for listing in listings:
        listing.cover_image_path = cover_by_listing_id.get(listing.id)


@router.get("", response_model=list[ListingOut])
def list_saved(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.seeker, UserRole.owner)),
) -> list[ListingOut]:
    statement = (
        select(Listing)
        .join(SavedListing, SavedListing.listing_id == Listing.id)
        .where(SavedListing.user_id == current_user.id)
        .order_by(SavedListing.created_at.desc())
    )
    listings = list(db.execute(statement).scalars())
    _attach_cover_images(db, listings)
    return listings


@router.post("/{listing_id}", status_code=status.HTTP_201_CREATED)
def save_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.seeker, UserRole.owner)),
) -> dict:
    listing = db.get(Listing, listing_id)
    if not listing or listing.is_hidden or not listing.is_available:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    existing = db.get(SavedListing, {"user_id": current_user.id, "listing_id": listing_id})
    if existing:
        return {"status": "exists"}

    saved = SavedListing(user_id=current_user.id, listing_id=listing_id)
    db.add(saved)
    db.commit()
    return {"status": "saved"}


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.seeker, UserRole.owner)),
) -> None:
    saved = db.get(SavedListing, {"user_id": current_user.id, "listing_id": listing_id})
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(saved)
    db.commit()
