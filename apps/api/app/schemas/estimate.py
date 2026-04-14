from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EstimateLabor(BaseModel):
    jobType: str | None = None
    level: str | None = None
    hoursChosen: float | None = Field(default=None, ge=0)
    hourlyRate: float | None = Field(default=None, ge=0)
    laborTotal: float | None = Field(default=None, ge=0)


class EstimateEquipmentLine(BaseModel):
    equipmentId: str | None = None
    freeText: str | None = None
    qty: float = Field(default=1, gt=0)
    unitPrice: float | None = Field(default=None, ge=0)
    lineTotal: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_line_reference(self) -> "EstimateEquipmentLine":
        if not self.equipmentId and not self.freeText:
            raise ValueError("equipmentId or freeText is required for each equipment line")
        return self


class EstimateAdjustment(BaseModel):
    code: str
    amount: float | None = None
    note: str | None = None


class EstimateTotals(BaseModel):
    laborTotal: float = Field(default=0, ge=0)
    equipmentTotal: float = Field(default=0, ge=0)
    adjustmentsTotal: float = Field(default=0)
    grandTotal: float = Field(default=0)


class EstimateBase(BaseModel):
    jobId: str
    customerId: str
    status: str = "draft"
    version: int = Field(default=1, ge=1)
    labor: EstimateLabor | None = None
    equipmentLines: list[EstimateEquipmentLine] = Field(default_factory=list)
    adjustments: list[EstimateAdjustment] = Field(default_factory=list)
    specialNotes: str | None = None
    totals: EstimateTotals | None = None


class EstimateCreate(EstimateBase):
    pass


class EstimateUpdate(BaseModel):
    version: int | None = Field(default=None, ge=1)
    labor: EstimateLabor | None = None
    equipmentLines: list[EstimateEquipmentLine] | None = None
    adjustments: list[EstimateAdjustment] | None = None
    specialNotes: str | None = None
    status: str | None = None
    totals: EstimateTotals | None = None


class EstimateRead(EstimateBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    createdAt: datetime
    updatedAt: datetime


class EstimateRepriceResponse(BaseModel):
    id: str
    labor: EstimateLabor | None = None
    equipmentLines: list[EstimateEquipmentLine] = Field(default_factory=list)
    adjustments: list[EstimateAdjustment] = Field(default_factory=list)
    totals: EstimateTotals
