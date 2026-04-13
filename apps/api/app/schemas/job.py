from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class JobBase(BaseModel):
    customerId: str | None = None
    address: str | None = None
    scheduledDate: date | None = None
    status: str | None = "draft"
    specialNotes: str | None = None


class JobCreate(JobBase):
    customerId: str


class JobUpdate(JobBase):
    pass


class JobRead(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customerId: str
    createdAt: datetime
    updatedAt: datetime
