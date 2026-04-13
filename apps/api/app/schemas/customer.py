from __future__ import annotations

from datetime import date

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class CustomerBase(BaseModel):
    name: str | None = None
    address: str | None = None
    phone: str | None = None
    propertyType: str | None = Field(
        default=None,
        validation_alias=AliasChoices("propertyType", "property_type"),
        serialization_alias="propertyType",
    )
    squareFootage: int | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices("squareFootage", "sqft"),
        serialization_alias="squareFootage",
    )
    systemType: str | None = None
    systemAge: int | None = Field(default=None, ge=0)
    lastServiceDate: date | None = None


class CustomerCreate(CustomerBase):
    id: str | None = None


class CustomerUpdate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
