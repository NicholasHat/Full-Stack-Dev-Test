from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.job import JobCreate, JobRead, JobUpdate
from app.services.customer_repository import get_customer
from app.services.job_repository import create_job, get_job, list_jobs, update_job

router = APIRouter(prefix="/jobs", tags=["jobs"])

'''
This module contains the API endpoints for managing jobs, including creating, reading, and updating job records.
'''

@router.post("", response_model=JobRead)
def create_job_endpoint(payload: JobCreate) -> JobRead:
    customer = get_customer(payload.customerId)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return create_job(payload)


@router.get("", response_model=list[JobRead])
def list_jobs_endpoint(customerId: str | None = None) -> list[JobRead]:
    return list_jobs(customer_id=customerId)


@router.get("/{job_id}", response_model=JobRead)
def get_job_endpoint(job_id: str) -> JobRead:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=JobRead)
def patch_job_endpoint(job_id: str, patch: JobUpdate) -> JobRead:
    if patch.customerId is not None and get_customer(patch.customerId) is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    updated = update_job(job_id, patch)
    if updated is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return updated
