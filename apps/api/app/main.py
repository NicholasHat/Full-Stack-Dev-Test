from __future__ import annotations

from fastapi import FastAPI

from app.routers.ai import router as ai_router
from app.settings import settings

app = FastAPI(title=settings.app_name)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.env}


app.include_router(ai_router)
