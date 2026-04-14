from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.init_db import init_db
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router
from app.routers.catalog import router as catalog_router
from app.routers.customers import router as customers_router
from app.routers.estimates import router as estimates_router
from app.routers.jobs import router as jobs_router
from app.settings import settings

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.env}


app.include_router(ai_router)
app.include_router(catalog_router)
app.include_router(customers_router)
app.include_router(jobs_router)
app.include_router(estimates_router)
app.include_router(admin_router)
