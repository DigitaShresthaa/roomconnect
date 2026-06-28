from pydantic import BaseModel


class UserAdminUpdate(BaseModel):
    is_active: bool | None = None
    is_verified: bool | None = None
    role: str | None = None
