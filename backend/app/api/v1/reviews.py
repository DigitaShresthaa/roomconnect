from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.review import UserReview
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, ReviewSummary

router = APIRouter(prefix="/reviews")


def _summary_for_user(db: Session, user_id: int) -> ReviewSummary:
    statement = (
        select(
            func.avg(UserReview.rating),
            func.count(UserReview.id),
        )
        .where(UserReview.reviewee_id == user_id)
    )
    avg, count = db.execute(statement).one()
    average_rating = float(avg) if avg is not None else None
    return ReviewSummary(reviewee_id=user_id, average_rating=average_rating, review_count=count)


@router.get("/users/{user_id}", response_model=list[ReviewOut])
def list_reviews(
    user_id: int,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
) -> list[ReviewOut]:
    statement = (
        select(UserReview)
        .where(UserReview.reviewee_id == user_id)
        .order_by(UserReview.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.execute(statement).scalars())


@router.get("/users/{user_id}/summary", response_model=ReviewSummary)
def review_summary(user_id: int, db: Session = Depends(get_db)) -> ReviewSummary:
    return _summary_for_user(db, user_id)


@router.get("/users/{user_id}/mine", response_model=ReviewOut | None)
def my_review(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewOut | None:
    statement = select(UserReview).where(
        UserReview.reviewer_id == current_user.id,
        UserReview.reviewee_id == user_id,
    )
    return db.execute(statement).scalar_one_or_none()


@router.post(
    "/users/{user_id}",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def upsert_review(
    user_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewOut:
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot review yourself")

    reviewee = db.get(User, user_id)
    if not reviewee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    statement = select(UserReview).where(
        UserReview.reviewer_id == current_user.id,
        UserReview.reviewee_id == user_id,
    )
    review = db.execute(statement).scalar_one_or_none()

    if review:
        review.rating = payload.rating
        review.review_text = payload.review_text
        db.commit()
        db.refresh(review)
        return review

    review = UserReview(
        reviewer_id=current_user.id,
        reviewee_id=user_id,
        rating=payload.rating,
        review_text=payload.review_text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
