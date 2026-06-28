from pydantic import BaseModel, Field


class ReferenceCreate(BaseModel):
    name: str = Field(..., max_length=120)
    is_active: bool = True


class ReferenceUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class ReferenceOut(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class DistrictCreate(ReferenceCreate):
    province_id: int


class DistrictOut(ReferenceOut):
    province_id: int


class LocalityCreate(ReferenceCreate):
    district_id: int


class LocalityOut(ReferenceOut):
    district_id: int
