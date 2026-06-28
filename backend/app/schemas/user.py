from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(..., max_length=120)
    email: EmailStr
    phone: str = Field(..., max_length=32)
    password: str = Field(..., min_length=8, max_length=72)
    role: Literal["owner", "seeker"]


class UserPublic(BaseModel):
    id: int
    role: str
    full_name: str
    email: EmailStr
    phone: str
    is_verified: bool
    is_active: bool

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: str = Field(..., max_length=120)
    role: Literal["owner", "seeker"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str
