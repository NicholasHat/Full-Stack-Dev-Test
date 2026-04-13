from __future__ import annotations

from app.schemas.ai_drafts import EstimateDraftInput
from app.schemas.estimate import EstimateAdjustment, EstimateEquipmentLine, EstimateLabor, EstimateRead, EstimateUpdate

'''
This module contains the logic for applying an EstimateDraftInput to an existing 
EstimateRead to produce an EstimateUpdate. This is used in the /estimates/{estimate_id}/apply-draft
endpoint to take the AI-generated draft and apply it to the existing estimate in 
a way that only updates the fields that were changed in the draft, leaving all other fields intact.
'''

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
