from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    admin_id: int
    action: str
    target_type: str
    target_id: int | None
    metadata: dict | None = Field(default=None, alias="meta")
    created_at: datetime
