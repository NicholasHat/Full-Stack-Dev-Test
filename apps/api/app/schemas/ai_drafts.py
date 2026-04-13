from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class DraftLabor(BaseModel):
    jobType: str | None = None
    level: str | None = None
    hoursChosen: float | None = Field(default=None, ge=0)


class DraftEquipmentLine(BaseModel):
    equipmentId: str | None = None
    freeText: str | None = None
    qty: float = Field(default=1, gt=0)

    @model_validator(mode="after")
    def validate_line_reference(self) -> "DraftEquipmentLine":
        if not self.equipmentId and not self.freeText:
            raise ValueError("equipmentId or freeText is required for each equipment line")
        return self


class DraftAdjustment(BaseModel):
    code: str


class EstimateDraftInput(BaseModel):
    jobId: str | None = None
    customerId: str | None = None
    labor: DraftLabor | None = None
    equipmentLines: list[DraftEquipmentLine] = Field(default_factory=list)
    adjustments: list[DraftAdjustment] = Field(default_factory=list)
    specialNotes: str | None = None
    missingRequiredFields: list[str] = Field(default_factory=list)


class AiDraftResult(BaseModel):
    draft: EstimateDraftInput
    retriesUsed: int = Field(default=0, ge=0, le=1)
    fallbackToEmptyDraft: bool = False
    validationErrors: list[str] = Field(default_factory=list)
    transcript: str | None = None
    extractedText: str | None = None


def empty_draft_payload() -> EstimateDraftInput:
    return EstimateDraftInput(
        jobId=None,
        customerId=None,
        labor=None,
        equipmentLines=[],
        adjustments=[],
        specialNotes=None,
        missingRequiredFields=[],
    )
