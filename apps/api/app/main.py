from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db.init_db import init_db
from app.routers.ai import router as ai_router
from app.routers.estimates import router as estimates_router
from app.settings import settings

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.env}


app.include_router(ai_router)
app.include_router(estimates_router)
