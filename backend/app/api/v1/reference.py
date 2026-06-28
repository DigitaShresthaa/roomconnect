from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_db, require_role
from app.models.reference import Category, District, Locality, Province
from app.models.user import User, UserRole
from app.schemas.reference import (
    DistrictCreate,
    DistrictOut,
    LocalityCreate,
    LocalityOut,
    ReferenceCreate,
    ReferenceOut,
    ReferenceUpdate,
)

router = APIRouter(prefix="/reference")
admin_only = Depends(require_role(UserRole.admin))


@router.get("/public/categories", response_model=list[ReferenceOut])
def public_categories(db: Session = Depends(get_db)) -> list[ReferenceOut]:
    return list(
        db.execute(select(Category).where(Category.is_active == True).order_by(Category.name)).scalars()
    )


@router.get("/public/provinces", response_model=list[ReferenceOut])
def public_provinces(db: Session = Depends(get_db)) -> list[ReferenceOut]:
    return list(
        db.execute(select(Province).where(Province.is_active == True).order_by(Province.name)).scalars()
    )


@router.get("/public/districts", response_model=list[DistrictOut])
def public_districts(
    db: Session = Depends(get_db),
    province_id: int | None = Query(default=None),
) -> list[DistrictOut]:
    statement = select(District).where(District.is_active == True)
    if province_id:
        statement = statement.where(District.province_id == province_id)
    return list(db.execute(statement.order_by(District.name)).scalars())


@router.get("/public/localities", response_model=list[LocalityOut])
def public_localities(
    db: Session = Depends(get_db),
    district_id: int | None = Query(default=None),
) -> list[LocalityOut]:
    statement = select(Locality).where(Locality.is_active == True)
    if district_id:
        statement = statement.where(Locality.district_id == district_id)
    return list(db.execute(statement.order_by(Locality.name)).scalars())


@router.get("/public/localities/{locality_id}", response_model=LocalityOut)
def public_locality_detail(
    locality_id: int,
    db: Session = Depends(get_db),
) -> LocalityOut:
    locality = db.get(Locality, locality_id)
    if not locality:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Locality not found")
    return locality


@router.get("/categories", response_model=list[ReferenceOut], dependencies=[admin_only])
def list_categories(db: Session = Depends(get_db)) -> list[ReferenceOut]:
    return list(db.execute(select(Category).order_by(Category.name)).scalars())


@router.post(
    "/categories",
    response_model=ReferenceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: ReferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> ReferenceOut:
    category = Category(name=payload.name, is_active=payload.is_active)
    db.add(category)
    try:
        db.flush()
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_create",
            target_type="category",
            target_id=category.id,
            metadata=payload.model_dump(),
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate entry")
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=ReferenceOut)
def update_category(
    category_id: int,
    payload: ReferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> ReferenceOut:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    updates = {}
    if payload.name is not None:
        category.name = payload.name
        updates["name"] = payload.name
    if payload.is_active is not None:
        category.is_active = payload.is_active
        updates["is_active"] = payload.is_active
    if not updates:
        return category
    record_audit(
        db,
        admin_id=current_user.id,
        action="reference_update",
        target_type="category",
        target_id=category.id,
        metadata=updates,
    )
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> None:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    metadata = {"name": category.name}
    db.delete(category)
    try:
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_delete",
            target_type="category",
            target_id=category_id,
            metadata=metadata,
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category in use")


@router.get("/provinces", response_model=list[ReferenceOut], dependencies=[admin_only])
def list_provinces(db: Session = Depends(get_db)) -> list[ReferenceOut]:
    return list(db.execute(select(Province).order_by(Province.name)).scalars())


@router.post(
    "/provinces",
    response_model=ReferenceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_province(
    payload: ReferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> ReferenceOut:
    province = Province(name=payload.name, is_active=payload.is_active)
    db.add(province)
    try:
        db.flush()
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_create",
            target_type="province",
            target_id=province.id,
            metadata=payload.model_dump(),
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate entry")
    db.refresh(province)
    return province


@router.put("/provinces/{province_id}", response_model=ReferenceOut)
def update_province(
    province_id: int,
    payload: ReferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> ReferenceOut:
    province = db.get(Province, province_id)
    if not province:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    updates = {}
    if payload.name is not None:
        province.name = payload.name
        updates["name"] = payload.name
    if payload.is_active is not None:
        province.is_active = payload.is_active
        updates["is_active"] = payload.is_active
    if not updates:
        return province
    record_audit(
        db,
        admin_id=current_user.id,
        action="reference_update",
        target_type="province",
        target_id=province.id,
        metadata=updates,
    )
    db.commit()
    db.refresh(province)
    return province


@router.delete("/provinces/{province_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_province(
    province_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> None:
    province = db.get(Province, province_id)
    if not province:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    metadata = {"name": province.name}
    db.delete(province)
    try:
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_delete",
            target_type="province",
            target_id=province_id,
            metadata=metadata,
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Province in use")


@router.get("/districts", response_model=list[DistrictOut], dependencies=[admin_only])
def list_districts(db: Session = Depends(get_db)) -> list[DistrictOut]:
    return list(db.execute(select(District).order_by(District.name)).scalars())


@router.post(
    "/districts",
    response_model=DistrictOut,
    status_code=status.HTTP_201_CREATED,
)
def create_district(
    payload: DistrictCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> DistrictOut:
    district = District(
        name=payload.name,
        province_id=payload.province_id,
        is_active=payload.is_active,
    )
    db.add(district)
    try:
        db.flush()
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_create",
            target_type="district",
            target_id=district.id,
            metadata=payload.model_dump(),
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate entry")
    db.refresh(district)
    return district


@router.put("/districts/{district_id}", response_model=DistrictOut)
def update_district(
    district_id: int,
    payload: ReferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> DistrictOut:
    district = db.get(District, district_id)
    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    updates = {}
    if payload.name is not None:
        district.name = payload.name
        updates["name"] = payload.name
    if payload.is_active is not None:
        district.is_active = payload.is_active
        updates["is_active"] = payload.is_active
    if not updates:
        return district
    record_audit(
        db,
        admin_id=current_user.id,
        action="reference_update",
        target_type="district",
        target_id=district.id,
        metadata=updates,
    )
    db.commit()
    db.refresh(district)
    return district


@router.delete("/districts/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_district(
    district_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> None:
    district = db.get(District, district_id)
    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    metadata = {"name": district.name}
    db.delete(district)
    try:
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_delete",
            target_type="district",
            target_id=district_id,
            metadata=metadata,
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="District in use")


@router.get("/localities", response_model=list[LocalityOut], dependencies=[admin_only])
def list_localities(db: Session = Depends(get_db)) -> list[LocalityOut]:
    return list(db.execute(select(Locality).order_by(Locality.name)).scalars())


@router.post(
    "/localities",
    response_model=LocalityOut,
    status_code=status.HTTP_201_CREATED,
)
def create_locality(
    payload: LocalityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> LocalityOut:
    locality = Locality(
        name=payload.name,
        district_id=payload.district_id,
        is_active=payload.is_active,
    )
    db.add(locality)
    try:
        db.flush()
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_create",
            target_type="locality",
            target_id=locality.id,
            metadata=payload.model_dump(),
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate entry")
    db.refresh(locality)
    return locality


@router.put("/localities/{locality_id}", response_model=LocalityOut)
def update_locality(
    locality_id: int,
    payload: ReferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> LocalityOut:
    locality = db.get(Locality, locality_id)
    if not locality:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    updates = {}
    if payload.name is not None:
        locality.name = payload.name
        updates["name"] = payload.name
    if payload.is_active is not None:
        locality.is_active = payload.is_active
        updates["is_active"] = payload.is_active
    if not updates:
        return locality
    record_audit(
        db,
        admin_id=current_user.id,
        action="reference_update",
        target_type="locality",
        target_id=locality.id,
        metadata=updates,
    )
    db.commit()
    db.refresh(locality)
    return locality


@router.delete("/localities/{locality_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_locality(
    locality_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> None:
    locality = db.get(Locality, locality_id)
    if not locality:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    metadata = {"name": locality.name}
    db.delete(locality)
    try:
        record_audit(
            db,
            admin_id=current_user.id,
            action="reference_delete",
            target_type="locality",
            target_id=locality_id,
            metadata=metadata,
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Locality in use")
