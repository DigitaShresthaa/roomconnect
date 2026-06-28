from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_current_user, get_current_user_optional, get_db, require_role
from app.core.media import delete_file, delete_listing_dir, save_upload_file
from app.models.listing import Listing, ListingMedia, MediaType
from app.models.reference import Locality
from app.models.review import UserReview
from app.models.user import User, UserRole
from app.schemas.listing import (
    HideListingRequest,
    ListingCreate,
    ListingMediaOut,
    ListingOut,
    ListingUpdate,
    MediaReorderRequest,
)

router = APIRouter(prefix="/listings")

MAX_MEDIA_PER_LISTING = 10
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024


def _attach_owner_ratings(db: Session, listings: list[Listing]) -> None:
    if not listings:
        return
    owner_ids = list({listing.owner_id for listing in listings})
    statement = (
        select(
            UserReview.reviewee_id,
            func.avg(UserReview.rating),
            func.count(UserReview.id),
        )
        .where(UserReview.reviewee_id.in_(owner_ids))
        .group_by(UserReview.reviewee_id)
    )
    rows = db.execute(statement).all()
    summary = {
        row[0]: (float(row[1]) if row[1] is not None else None, row[2]) for row in rows
    }
    for listing in listings:
        avg, count = summary.get(listing.owner_id, (None, 0))
        listing.owner_rating_avg = avg
        listing.owner_rating_count = count


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


def _serialize_listing(listing: Listing) -> ListingOut:
    serialized = ListingOut.model_validate(listing, from_attributes=True)
    return serialized.model_copy(update={"cover_image_path": getattr(listing, "cover_image_path", None)})


def _listing_payload(listing: Listing) -> dict:
    return _serialize_listing(listing).model_dump(mode="json")


@router.get("", response_model=list[ListingOut])
def list_listings(
    db: Session = Depends(get_db),
    q: str | None = None,
    province_id: int | None = None,
    district_id: int | None = None,
    locality_id: int | None = None,
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_size: float | None = None,
    max_size: float | None = None,
    is_available: bool | None = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> list[ListingOut]:
    filters = [Listing.is_hidden == False]
    if is_available is not None:
        filters.append(Listing.is_available == is_available)
    if province_id:
        filters.append(Listing.province_id == province_id)
    if district_id:
        filters.append(Listing.district_id == district_id)
    if locality_id:
        filters.append(Listing.locality_id == locality_id)
    if category_id:
        filters.append(Listing.category_id == category_id)
    if q:
        like = f"%{q}%"
        filters.append((Listing.title.ilike(like)) | (Listing.description.ilike(like)))
    if min_price is not None:
        filters.append(Listing.price_amount >= min_price)
    if max_price is not None:
        filters.append(Listing.price_amount <= max_price)
    if min_size is not None:
        filters.append(Listing.size_value >= min_size)
    if max_size is not None:
        filters.append(Listing.size_value <= max_size)

    statement = (
        select(Listing)
        .where(and_(*filters))
        .order_by(Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = list(db.execute(statement).scalars())
    _attach_cover_images(db, listings)
    _attach_owner_ratings(db, listings)
    return JSONResponse(content=[_listing_payload(listing) for listing in listings])


@router.get("/recommended", response_model=list[ListingOut])
def recommended_listings(
    db: Session = Depends(get_db),
    locality_id: int | None = None,
) -> list[ListingOut]:
    limit = 4
    if locality_id:
        locality = db.get(Locality, locality_id)
        if locality:
            listings = list(
                db.execute(
                    select(Listing)
                    .where(
                        Listing.is_hidden == False,
                        Listing.is_available == True,
                        Listing.locality_id == locality_id,
                    )
                    .order_by(Listing.created_at.desc())
                    .limit(limit)
                ).scalars()
            )
            if listings:
                _attach_cover_images(db, listings)
                _attach_owner_ratings(db, listings)
                return JSONResponse(content=[_listing_payload(l) for l in listings])

            listings = list(
                db.execute(
                    select(Listing)
                    .where(
                        Listing.is_hidden == False,
                        Listing.is_available == True,
                        Listing.district_id == locality.district_id,
                    )
                    .order_by(Listing.created_at.desc())
                    .limit(limit)
                ).scalars()
            )
            _attach_cover_images(db, listings)
            _attach_owner_ratings(db, listings)
            return JSONResponse(content=[_listing_payload(l) for l in listings])

    return JSONResponse(content=[])


@router.get("/admin/all", response_model=list[ListingOut])
def admin_list_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
    is_hidden: bool | None = None,
    is_available: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[ListingOut]:
    filters = []
    if is_hidden is not None:
        filters.append(Listing.is_hidden == is_hidden)
    if is_available is not None:
        filters.append(Listing.is_available == is_available)

    statement = (
        select(Listing)
        .where(and_(*filters))
        .order_by(Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = list(db.execute(statement).scalars())
    _attach_cover_images(db, listings)
    _attach_owner_ratings(db, listings)
    return JSONResponse(content=[_listing_payload(listing) for listing in listings])


@router.get("/admin/{listing_id}", response_model=ListingOut)
def admin_get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> ListingOut:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    _attach_cover_images(db, [listing])
    _attach_owner_ratings(db, [listing])
    return JSONResponse(content=_listing_payload(listing))


@router.get("/owner", response_model=list[ListingOut])
def owner_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.owner)),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[ListingOut]:
    statement = (
        select(Listing)
        .where(Listing.owner_id == current_user.id)
        .order_by(Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = list(db.execute(statement).scalars())
    _attach_cover_images(db, listings)
    _attach_owner_ratings(db, listings)
    return JSONResponse(content=[_listing_payload(listing) for listing in listings])


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> ListingOut:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if listing.is_hidden or not listing.is_available:
        if not current_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        if current_user.role == UserRole.admin:
            _attach_cover_images(db, [listing])
            return listing
        if current_user.role == UserRole.owner and listing.owner_id == current_user.id:
            _attach_cover_images(db, [listing])
            return listing
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    _attach_cover_images(db, [listing])
    _attach_owner_ratings(db, [listing])
    return JSONResponse(content=_listing_payload(listing))


@router.post("", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.owner)),
) -> ListingOut:
    listing = Listing(**payload.model_dump(), owner_id=current_user.id)
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return JSONResponse(content=_listing_payload(listing))


@router.put("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.owner)),
) -> ListingOut:
    listing = db.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(listing, key, value)

    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if current_user.role != UserRole.admin and listing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if current_user.role == UserRole.admin:
        record_audit(
            db,
            admin_id=current_user.id,
            action="listing_delete",
            target_type="listing",
            target_id=listing.id,
            metadata={"title": listing.title},
        )

    media_items = db.execute(
        select(ListingMedia).where(ListingMedia.listing_id == listing.id)
    ).scalars().all()
    for media in media_items:
        delete_file(media.file_path)

    db.delete(listing)
    db.commit()
    delete_listing_dir(listing.id)


@router.patch("/{listing_id}/hide", response_model=ListingOut)
def hide_listing(
    listing_id: int,
    payload: HideListingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ListingOut:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if current_user.role != UserRole.admin and listing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if current_user.role == UserRole.admin:
        record_audit(
            db,
            admin_id=current_user.id,
            action="listing_hide",
            target_type="listing",
            target_id=listing.id,
            metadata={"is_hidden": payload.is_hidden},
        )

    listing.is_hidden = payload.is_hidden
    db.commit()
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/media", response_model=list[ListingMediaOut])
async def upload_media(
    listing_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.owner)),
) -> list[ListingMediaOut]:
    listing = db.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    existing = db.execute(
        select(ListingMedia).where(ListingMedia.listing_id == listing_id)
    ).scalars().all()

    if len(existing) + len(files) > MAX_MEDIA_PER_LISTING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many files")

    saved_media: list[ListingMedia] = []

    for upload in files:
        content_type = upload.content_type or ""
        if content_type.startswith("image/"):
            max_size = MAX_IMAGE_BYTES
            media_type = MediaType.image
        elif content_type.startswith("video/"):
            max_size = MAX_VIDEO_BYTES
            media_type = MediaType.video
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

        content = await upload.read()
        if len(content) > max_size:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

        file_path = save_upload_file(listing_id, upload, content)
        media = ListingMedia(
            listing_id=listing_id,
            media_type=media_type,
            file_path=file_path,
            sort_order=len(existing) + len(saved_media),
        )
        db.add(media)
        saved_media.append(media)

    db.commit()
    for media in saved_media:
        db.refresh(media)

    return saved_media


@router.get("/{listing_id}/media", response_model=list[ListingMediaOut])
def list_media(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> list[ListingMediaOut]:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if listing.is_hidden or not listing.is_available:
        if not current_user or current_user.role not in [UserRole.admin, UserRole.owner]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        if current_user.role == UserRole.owner and listing.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    statement = (
        select(ListingMedia)
        .where(ListingMedia.listing_id == listing_id)
        .order_by(ListingMedia.sort_order.asc())
    )
    return list(db.execute(statement).scalars())


@router.post("/{listing_id}/media/reorder", response_model=list[ListingMediaOut])
def reorder_media(
    listing_id: int,
    payload: MediaReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ListingMediaOut]:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if current_user.role != UserRole.admin and listing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    media_items = db.execute(
        select(ListingMedia).where(ListingMedia.listing_id == listing_id)
    ).scalars().all()
    media_by_id = {item.id: item for item in media_items}

    if set(payload.ordered_ids) != set(media_by_id.keys()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media list")

    for index, media_id in enumerate(payload.ordered_ids):
        media_by_id[media_id].sort_order = index

    db.commit()
    return list(db.execute(
        select(ListingMedia)
        .where(ListingMedia.listing_id == listing_id)
        .order_by(ListingMedia.sort_order.asc())
    ).scalars())


@router.delete("/{listing_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    listing_id: int,
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    media = db.get(ListingMedia, media_id)
    if not media or media.listing_id != listing_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if current_user.role != UserRole.admin and listing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if current_user.role == UserRole.admin:
        record_audit(
            db,
            admin_id=current_user.id,
            action="listing_media_delete",
            target_type="listing_media",
            target_id=media.id,
            metadata={"listing_id": listing.id},
        )

    delete_file(media.file_path)
    db.delete(media)
    db.commit()
    delete_listing_dir(listing.id)
