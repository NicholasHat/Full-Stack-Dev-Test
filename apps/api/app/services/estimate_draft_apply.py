from __future__ import annotations

from app.schemas.ai_drafts import EstimateDraftInput
from app.schemas.estimate import EstimateAdjustment, EstimateEquipmentLine, EstimateLabor, EstimateRead, EstimateUpdate


def apply_draft_to_estimate(current: EstimateRead, draft: EstimateDraftInput) -> EstimateUpdate:
    labor = current.labor
    if draft.labor:
        existing = labor.model_dump(mode="json") if labor else {}
        incoming = draft.labor.model_dump(exclude_unset=True, mode="json")
        labor = EstimateLabor.model_validate({**existing, **incoming})

    equipment_lines = None
    if draft.equipmentLines:
        equipment_lines = [EstimateEquipmentLine.model_validate(line.model_dump(mode="json")) for line in draft.equipmentLines]

    adjustments = None
    if draft.adjustments:
        adjustments = [EstimateAdjustment.model_validate(adj.model_dump(mode="json")) for adj in draft.adjustments]

    special_notes = current.specialNotes
    if draft.specialNotes is not None:
        special_notes = draft.specialNotes

    return EstimateUpdate(
        labor=labor,
        equipmentLines=equipment_lines,
        adjustments=adjustments,
        specialNotes=special_notes,
    )
