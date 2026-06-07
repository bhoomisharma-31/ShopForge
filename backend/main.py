"""
ShopForge Backend — FastAPI Entry Point

Bootstrap the ASGI application, wire up the MongoDB connection lifecycle,
ensure collections + indexes exist, and expose a health-check endpoint.

Run:
    uvicorn main:app --reload
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.indexes import create_indexes
from app.db.mongodb import (
    close_mongo_connection,
    connect_to_mongo,
    db,
    ensure_collections,
)
from app.api.v1.router import api_router

# ------------------------------------------------------------------
# Logging configuration
# ------------------------------------------------------------------

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Lifespan: startup / shutdown hooks
# ------------------------------------------------------------------


@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Startup:
        1. Connect to MongoDB (ping verified).
        2. Ensure required collections exist (auto-create if missing).
        3. Create / verify database indexes.

    Shutdown:
        1. Close MongoDB connection gracefully.
    """
    logger.info("=" * 60)
    logger.info("🚀 %s — starting up …", settings.APP_NAME)
    logger.info("=" * 60)

    # 1. Connect
    await connect_to_mongo()

    # 2. Collections
    await ensure_collections()

    # 3. Indexes
    await create_indexes()

    logger.info("=" * 60)
    logger.info("✅ %s — ready to accept requests.", settings.APP_NAME)
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("🛑 %s — shutting down …", settings.APP_NAME)
    await close_mongo_connection()


# ------------------------------------------------------------------
# Application factory
# ------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# -- CORS ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Include V1 Router --------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# -- Health check -------------------------------------------------


@app.get("/health", tags=["health"])
async def health_check():
    """
    Returns application status **and** a live MongoDB connection report
    (ping, server version, available collections).
    """
    mongo_report = await db.health_report()

    return {
        "status": "ok" if mongo_report.get("connected") else "degraded",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "mongodb": mongo_report,
    }
