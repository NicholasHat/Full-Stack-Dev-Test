from __future__ import annotations

from pydantic import AliasChoices, BaseModel, Field, model_validator


class EstimatedHours(BaseModel):
    min: float = Field(ge=0)
    max: float = Field(ge=0)

    @model_validator(mode="after")
    def validate_range(self) -> "EstimatedHours":
        if self.max < self.min:
            raise ValueError("estimatedHours.max must be greater than or equal to estimatedHours.min")
        return self


class LaborRate(BaseModel):
    jobType: str
    level: str
    hourlyRate: float = Field(ge=0)
    estimatedHours: EstimatedHours


class Equipment(BaseModel):
    id: str
    name: str
    category: str
    brand: str
    modelNumber: str
    baseCost: float = Field(
        ge=0,
        validation_alias=AliasChoices("baseCost", "base_cost"),
        serialization_alias="baseCost",
    )


class BundleLabor(BaseModel):
    jobType: str | None = None
    level: str | None = None
    hoursChosen: float | None = Field(default=None, ge=0)


class BundleEquipmentLine(BaseModel):
    equipmentId: str | None = None
    qty: float = Field(default=1, gt=0)


class BundleAdjustment(BaseModel):
    code: str


class Bundle(BaseModel):
    id: str
    name: str
    description: str | None = None
    labor: BundleLabor | None = None
    equipmentLines: list[BundleEquipmentLine] = Field(default_factory=list)
    adjustments: list[BundleAdjustment] = Field(default_factory=list)
    notesTemplate: str | None = None
