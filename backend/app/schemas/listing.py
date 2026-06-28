from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class ListingCreate(BaseModel):
    title: str = Field(..., max_length=160)
    description: str | None = None
    category_id: int | None = None
    price_amount: Decimal
    price_period: Literal["month", "week", "day"] = "month"
    size_value: Decimal | None = None
    bedrooms: int = 1
    halls: int = 1
    kitchens: int = 1
    bathrooms: int = 1
    is_available: bool = True
    is_hidden: bool = False
    province_id: int
    district_id: int
    locality_id: int
    street: str | None = Field(default=None, max_length=180)
    amenities_text: str | None = None
    house_rules_text: str | None = None
    preferred_tenant_text: str | None = None


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=160)
    description: str | None = None
    category_id: int | None = None
    price_amount: Decimal | None = None
    price_period: Literal["month", "week", "day"] | None = None
    size_value: Decimal | None = None
    bedrooms: int | None = None
    halls: int | None = None
    kitchens: int | None = None
    bathrooms: int | None = None
    is_available: bool | None = None
    is_hidden: bool | None = None
    province_id: int | None = None
    district_id: int | None = None
    locality_id: int | None = None
    street: str | None = Field(default=None, max_length=180)
    amenities_text: str | None = None
    house_rules_text: str | None = None
    preferred_tenant_text: str | None = None


class ListingOut(BaseModel):
    id: int
    owner_id: int
    title: str
    description: str | None
    category_id: int | None
    price_amount: Decimal
    price_period: str
    size_value: Decimal | None
    bedrooms: int
    halls: int
    kitchens: int
    bathrooms: int
    is_available: bool
    is_hidden: bool
    province_id: int
    district_id: int
    locality_id: int
    street: str | None
    amenities_text: str | None
    house_rules_text: str | None
    preferred_tenant_text: str | None
    cover_image_path: str | None = None
    owner_rating_avg: float | None = None
    owner_rating_count: int = 0

    class Config:
        from_attributes = True


class ListingMediaOut(BaseModel):
    id: int
    listing_id: int
    media_type: str
    file_path: str
    sort_order: int

    class Config:
        from_attributes = True


class HideListingRequest(BaseModel):
    is_hidden: bool


class MediaReorderRequest(BaseModel):
    ordered_ids: list[int]
