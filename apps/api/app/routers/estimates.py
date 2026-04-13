from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.ai_drafts import EstimateDraftInput
from app.schemas.estimate import EstimateCreate, EstimateRead, EstimateUpdate
from app.services.estimate_draft_apply import apply_draft_to_estimate
from app.services.estimate_repository import create_estimate, get_estimate, list_estimates, update_estimate

router = APIRouter(prefix="/estimates", tags=["estimates"])


@router.post("", response_model=EstimateRead)
def create_estimate_endpoint(payload: EstimateCreate) -> EstimateRead:
    return create_estimate(payload)


@router.get("", response_model=list[EstimateRead])
def list_estimates_endpoint(jobId: str | None = None) -> list[EstimateRead]:
    return list_estimates(jobId)


@router.get("/{estimate_id}", response_model=EstimateRead)
def get_estimate_endpoint(estimate_id: str) -> EstimateRead:
    estimate = get_estimate(estimate_id)
    if estimate is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return estimate


@router.patch("/{estimate_id}", response_model=EstimateRead)
def patch_estimate_endpoint(estimate_id: str, patch: EstimateUpdate) -> EstimateRead:
    current = get_estimate(estimate_id)
    if current is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    if current.status == "finalized":
        raise HTTPException(status_code=409, detail="Finalized estimate cannot be updated")

    updated = update_estimate(estimate_id, patch)
    if updated is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return updated


@router.post("/{estimate_id}/apply-draft", response_model=EstimateRead)
def apply_draft_endpoint(estimate_id: str, draft: EstimateDraftInput) -> EstimateRead:
    current = get_estimate(estimate_id)
    if current is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    if current.status == "finalized":
        raise HTTPException(status_code=409, detail="Finalized estimate cannot be updated")

    patch = apply_draft_to_estimate(current, draft)
    updated = update_estimate(estimate_id, patch)
    if updated is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return updated
