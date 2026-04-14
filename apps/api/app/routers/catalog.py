from __future__ import annotations

from fastapi import APIRouter

from app.schemas.catalog import Bundle, Equipment, LaborRate
from app.services.catalog_loader import load_bundles, load_equipment, load_labor_rates

router = APIRouter(prefix="/catalog", tags=["catalog"])

'''
This module contains the API endpoints for retrieving the catalog data, including equipment, 
labor rates, and bundles. The data is loaded from JSON files and cached for performance.
'''

@router.get("/equipment", response_model=list[Equipment])
def get_equipment_endpoint() -> list[Equipment]:
    return load_equipment()


@router.get("/labor-rates", response_model=list[LaborRate])
def get_labor_rates_endpoint() -> list[LaborRate]:
    return load_labor_rates()


@router.get("/bundles", response_model=list[Bundle])
def get_bundles_endpoint() -> list[Bundle]:
    return load_bundles()
