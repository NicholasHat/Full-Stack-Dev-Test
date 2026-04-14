from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.ai_drafts import EstimateDraftInput
from app.schemas.estimate import EstimateCreate, EstimateRead, EstimateRepriceResponse, EstimateUpdate
from app.services.customer_repository import get_customer
from app.services.estimate_draft_apply import apply_draft_to_estimate
from app.services.estimate_repository import create_estimate, get_estimate, list_estimates, update_estimate
from app.services.job_repository import get_job
from app.services.pricing import reprice_estimate

router = APIRouter(prefix="/estimates", tags=["estimates"])

'''
This module contains the API endpoints for managing estimates, including creating, reading, updating, and repricing estimates. It also includes the endpoint for applying an AI-generated draft to an existing estimate, which uses the apply_draft_to_estimate function to merge the draft with the existing estimate data.
'''

@router.post("", response_model=EstimateRead)
def create_estimate_endpoint(payload: EstimateCreate) -> EstimateRead:
    if get_customer(payload.customerId) is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    if get_job(payload.jobId) is None:
        raise HTTPException(status_code=404, detail="Job not found")
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


@router.post("/{estimate_id}/reprice", response_model=EstimateRepriceResponse)
def reprice_estimate_endpoint(estimate_id: str) -> EstimateRepriceResponse:
    estimate = get_estimate(estimate_id)
    if estimate is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    if estimate.status == "finalized":
        raise HTTPException(status_code=409, detail="Finalized estimate cannot be repriced")

    repriced = reprice_estimate(estimate)

    update_estimate(
        estimate_id,
        EstimateUpdate(
            labor=repriced.labor,
            equipmentLines=repriced.equipmentLines,
            adjustments=repriced.adjustments,
            totals=repriced.totals,
        ),
    )

    return repriced


@router.post("/{estimate_id}/finalize", response_model=EstimateRead)
def finalize_estimate_endpoint(estimate_id: str) -> EstimateRead:
    estimate = get_estimate(estimate_id)
    if estimate is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    if estimate.status == "finalized":
        raise HTTPException(status_code=409, detail="Estimate is already finalized")

    updated = update_estimate(
        estimate_id,
        EstimateUpdate(status="finalized", version=estimate.version + 1, totals=estimate.totals),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return updated
