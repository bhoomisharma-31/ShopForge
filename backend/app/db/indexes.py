"""
ShopForge — Database Index Management

Creates indexes on all collections during application startup.
Called after :func:`ensure_collections` so that every collection is
guaranteed to exist.

Usage:
    from app.db.indexes import create_indexes

    await create_indexes()
"""

from __future__ import annotations

import logging

from pymongo import ASCENDING, DESCENDING, TEXT

from app.db.mongodb import db

logger = logging.getLogger(__name__)


async def create_indexes() -> None:
    """
    Create / ensure indexes for every collection.

    Motor's ``create_index`` is idempotent — if the index already exists
    it is a no-op.
    """
    logger.info("Creating database indexes …")

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    await db.users.create_index(
        [("email", ASCENDING)],
        unique=True,
        name="idx_users_email_unique",
    )
    logger.info("  ✅ users  — idx_users_email_unique")

    # ------------------------------------------------------------------
    # products
    # ------------------------------------------------------------------
    await db.products.create_index(
        [("name", TEXT), ("description", TEXT)],
        name="idx_products_text_search",
    )
    await db.products.create_index(
        [("category", ASCENDING)],
        name="idx_products_category",
    )
    await db.products.create_index(
        [("price", ASCENDING)],
        name="idx_products_price",
    )
    await db.products.create_index(
        [("created_at", DESCENDING)],
        name="idx_products_created_at",
    )
    logger.info("  ✅ products — text search, category, price, created_at")

    # ------------------------------------------------------------------
    # orders
    # ------------------------------------------------------------------
    await db.orders.create_index(
        [("user_id", ASCENDING)],
        name="idx_orders_user_id",
    )
    await db.orders.create_index(
        [("status", ASCENDING)],
        name="idx_orders_status",
    )
    await db.orders.create_index(
        [("created_at", DESCENDING)],
        name="idx_orders_created_at",
    )
    logger.info("  ✅ orders  — user_id, status, created_at")

    # ------------------------------------------------------------------
    # reviews
    # ------------------------------------------------------------------
    await db.reviews.create_index(
        [("product_id", ASCENDING)],
        name="idx_reviews_product_id",
    )
    await db.reviews.create_index(
        [("user_id", ASCENDING)],
        name="idx_reviews_user_id",
    )
    await db.reviews.create_index(
        [("product_id", ASCENDING), ("user_id", ASCENDING)],
        unique=True,
        name="idx_reviews_product_user_unique",
    )
    logger.info("  ✅ reviews — product_id, user_id, product+user unique")

    logger.info("✅ All database indexes created successfully.")
