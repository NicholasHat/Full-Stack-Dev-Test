from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response

from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.services.customer_repository import create_customer, delete_customer, get_customer, list_customers, update_customer

router = APIRouter(prefix="/customers", tags=["customers"])

'''
This module contains the API endpoints for managing customers, including creating, reading, and updating customer records.
'''

@router.post("", response_model=CustomerRead)
def create_customer_endpoint(payload: CustomerCreate) -> CustomerRead:
    return create_customer(payload)


@router.get("", response_model=list[CustomerRead])
def list_customers_endpoint(query: str | None = None) -> list[CustomerRead]:
    return list_customers(query=query)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer_endpoint(customer_id: str) -> CustomerRead:
    customer = get_customer(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerRead)
def patch_customer_endpoint(customer_id: str, patch: CustomerUpdate) -> CustomerRead:
    updated = update_customer(customer_id, patch)
    if updated is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated


@router.delete("/{customer_id}", status_code=204)
def delete_customer_endpoint(customer_id: str) -> Response:
    if get_customer(customer_id) is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    delete_customer(customer_id)
    return Response(status_code=204)
