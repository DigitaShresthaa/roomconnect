import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, BigInteger, Integer, Numeric, String, Text, SmallInteger
from sqlalchemy.sql import func

from app.db.session import Base


class PricePeriod(str, enum.Enum):
    month = "month"
    week = "week"
    day = "day"


class Listing(Base):
    __tablename__ = "listings"

    id = Column(BigInteger, primary_key=True, index=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)

    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=True)

    price_amount = Column(Numeric(12, 2), nullable=False)
    price_period = Column(Enum(PricePeriod), nullable=False, default=PricePeriod.month)

    size_value = Column(Numeric(10, 2), nullable=True)

    bedrooms = Column(SmallInteger, nullable=False, default=1)
    halls = Column(SmallInteger, nullable=False, default=1)
    kitchens = Column(SmallInteger, nullable=False, default=1)
    bathrooms = Column(SmallInteger, nullable=False, default=1)

    is_available = Column(Boolean, nullable=False, default=True)
    is_hidden = Column(Boolean, nullable=False, default=False)

    province_id = Column(BigInteger, ForeignKey("provinces.id"), nullable=False)
    district_id = Column(BigInteger, ForeignKey("districts.id"), nullable=False)
    locality_id = Column(BigInteger, ForeignKey("localities.id"), nullable=False)
    street = Column(String(180), nullable=True)

    amenities_text = Column(Text, nullable=True)
    house_rules_text = Column(Text, nullable=True)
    preferred_tenant_text = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class MediaType(str, enum.Enum):
    image = "image"
    video = "video"


class ListingMedia(Base):
    __tablename__ = "listing_media"

    id = Column(BigInteger, primary_key=True, index=True)
    listing_id = Column(BigInteger, ForeignKey("listings.id"), nullable=False)
    media_type = Column(Enum(MediaType, native_enum=False), nullable=False)
    file_path = Column(String(500), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
