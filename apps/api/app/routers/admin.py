from __future__ import annotations

from fastapi import APIRouter

from app.services.admin import reset_demo_data

router = APIRouter(prefix="/admin", tags=["admin"])


'''To keep the API organized, this module contains administrative endpoints that are not part of the core functionality of the application. Currently, it includes an endpoint to reset the demo data in the database, which can be useful for testing and development purposes.
'''

@router.post("/reset-demo-data")
def reset_demo_data_endpoint() -> dict[str, int]:
    return reset_demo_data()
