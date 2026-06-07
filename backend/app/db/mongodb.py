"""
ShopForge — MongoDB Database Manager

Async MongoDB connection lifecycle managed through a single
:class:`Database` instance.  Intended to be wired into FastAPI's
startup / shutdown events (or lifespan context).

Usage:
    from app.db.mongodb import db

    # In FastAPI lifespan:
    await db.connect()
    await db.ensure_collections()
    ...
    await db.disconnect()

    # Anywhere else:
    database = db.get_database()
    users    = db.users
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)

# Collections that must exist in the database.
REQUIRED_COLLECTIONS: List[str] = [
    "users",
    "products",
    "orders",
    "reviews",
]


class Database:
    """
    Encapsulates the Motor async client and exposes typed collection
    accessors.  All mutable state is contained within this class — no
    module-level globals leak out.
    """

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def __init__(self) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._database: Optional[AsyncIOMotorDatabase] = None

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """
        Open the Motor client, select the database, and verify the
        connection with a ``ping`` command.

        Raises:
            ConnectionError: If the MongoDB server is unreachable.
        """
        if self._client is not None:
            logger.warning("connect() called but a client already exists — skipping.")
            return

        mongo_url = settings.mongodb_url_str
        db_name = settings.DATABASE_NAME

        logger.info("Connecting to MongoDB at %s …", _mask_url(mongo_url))

        self._client = AsyncIOMotorClient(
            mongo_url,
            # Sensible production defaults
            maxPoolSize=50,
            minPoolSize=5,
            serverSelectionTimeoutMS=5_000,
            connectTimeoutMS=10_000,
            retryWrites=True,
        )
        self._database = self._client[db_name]

        # Health-check: fail fast if the server is unreachable.
        try:
            result = await self._client.admin.command("ping")
            logger.info(
                "✅ MongoDB connected — ping: %s",
                result,
            )
        except Exception as exc:
            self._client = None
            self._database = None
            logger.critical("❌ MongoDB ping failed: %s", exc)
            raise ConnectionError(
                f"Unable to reach MongoDB at {_mask_url(mongo_url)}"
            ) from exc

        # Log server info
        try:
            server_info = await self._client.server_info()
            logger.info(
                "✅ MongoDB server version: %s",
                server_info.get("version", "unknown"),
            )
        except Exception:
            logger.debug("Could not retrieve MongoDB server info.")

        logger.info("✅ Database selected: '%s'", db_name)

    async def disconnect(self) -> None:
        """Close the Motor client gracefully."""
        if self._client is None:
            logger.debug("disconnect() called but no client is active.")
            return

        logger.info("Closing MongoDB connection …")
        self._client.close()
        self._client = None
        self._database = None
        logger.info("✅ MongoDB connection closed.")

    # ------------------------------------------------------------------
    # Collection bootstrapping
    # ------------------------------------------------------------------

    async def ensure_collections(self) -> None:
        """
        Create any missing collections from :data:`REQUIRED_COLLECTIONS`.

        MongoDB creates collections lazily on first insert, but creating
        them explicitly at startup lets us:
        - confirm the database is writable,
        - log which collections exist vs. were just created,
        - set up indexes immediately afterward.
        """
        database = self.get_database()
        existing: List[str] = await database.list_collection_names()

        logger.info(
            "Existing collections in '%s': %s",
            settings.DATABASE_NAME,
            existing or "(none)",
        )

        created: List[str] = []
        for name in REQUIRED_COLLECTIONS:
            if name not in existing:
                await database.create_collection(name)
                created.append(name)

        if created:
            logger.info("✅ Created missing collections: %s", created)
        else:
            logger.info("✅ All required collections already exist.")

        # Seed initial data
        await self.seed_data()

        # Final confirmation
        final_collections = await database.list_collection_names()
        logger.info(
            "✅ Collections available: %s",
            sorted(final_collections),
        )

    async def seed_data(self) -> None:
        """Seed initial products and default users if they don't exist."""
        # 1. Seed Users
        users_count = await self.users.count_documents({})
        if users_count == 0:
            logger.info("Seeding default users ...")
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hashed_password = pwd_context.hash("password123")
            
            await self.users.insert_many([
                {
                    "name": "Admin User",
                    "email": "admin@shopforge.com",
                    "hashed_password": hashed_password,
                    "role": "admin",
                    "is_active": True,
                },
                {
                    "name": "Demo User",
                    "email": "user@shopforge.com",
                    "hashed_password": hashed_password,
                    "role": "customer",
                    "is_active": True,
                }
            ])
            logger.info("✅ Default users seeded.")

        # 2. Seed Products
        products_count = await self.products.count_documents({})
        if products_count == 0:
            logger.info("Seeding initial products ...")
            import datetime
            now = datetime.datetime.now(datetime.timezone.utc)
            
            demo_products = [
                { "name": 'Wireless Headphones Pro', "price": 149.99, "category": 'Electronics', "rating": 4.5, "reviews_count": 128, "description": "Premium noise-cancelling headphones", "stock": 15, "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Leather Crossbody Bag', "price": 89.00, "category": 'Accessories', "rating": 4.8, "reviews_count": 64, "description": "Handcrafted genuine leather crossbody bag", "stock": 20, "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Smart Fitness Watch', "price": 199.99, "category": 'Electronics', "rating": 4.3, "reviews_count": 256, "description": "Waterproof fitness watch with heart rate monitor", "stock": 10, "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Organic Cotton T-Shirt', "price": 34.99, "category": 'Clothing', "rating": 4.6, "reviews_count": 92, "description": "100% organic cotton comfortable t-shirt", "stock": 50, "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Ceramic Pour-Over Set', "price": 54.00, "category": 'Kitchen', "rating": 4.9, "reviews_count": 48, "description": "Handmade ceramic coffee pour-over set", "stock": 12, "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Minimalist Desk Lamp', "price": 79.99, "category": 'Home', "rating": 4.4, "reviews_count": 156, "description": "Sleek and adjustable minimalist LED desk lamp", "stock": 18, "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Running Shoes Elite', "price": 129.99, "category": 'Sports', "rating": 4.7, "reviews_count": 312, "description": "High performance running shoes with maximum cushioning", "stock": 25, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Bamboo Sunglasses', "price": 45.00, "category": 'Accessories', "rating": 4.2, "reviews_count": 73, "description": "Polarized sunglasses made from sustainable bamboo", "stock": 30, "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Portable Bluetooth Speaker', "price": 69.99, "category": 'Electronics', "rating": 4.6, "reviews_count": 189, "description": "Waterproof portable wireless speaker", "stock": 22, "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60" },
                { "name": 'Yoga Mat Premium', "price": 49.99, "category": 'Sports', "rating": 4.8, "reviews_count": 95, "description": "Eco-friendly non-slip yoga and exercise mat", "stock": 40, "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&auto=format&fit=crop&q=60" }
            ]
            
            products_to_insert = []
            for p in demo_products:
                p_copy = p.copy()
                p_copy["created_at"] = now
                products_to_insert.append(p_copy)
            
            await self.products.insert_many(products_to_insert)
            logger.info("✅ Initial products seeded.")

    # ------------------------------------------------------------------
    # Database accessor
    # ------------------------------------------------------------------

    def get_database(self) -> AsyncIOMotorDatabase:
        """
        Return the active :class:`AsyncIOMotorDatabase`.

        Raises:
            RuntimeError: If called before :meth:`connect`.
        """
        if self._database is None:
            raise RuntimeError(
                "Database is not initialised. "
                "Call 'await db.connect()' before accessing the database."
            )
        return self._database

    # ------------------------------------------------------------------
    # Collection accessors (typed shortcuts)
    # ------------------------------------------------------------------

    @property
    def users(self) -> AsyncIOMotorCollection:
        """The ``users`` collection."""
        return self.get_database()["users"]

    @property
    def products(self) -> AsyncIOMotorCollection:
        """The ``products`` collection."""
        return self.get_database()["products"]

    @property
    def orders(self) -> AsyncIOMotorCollection:
        """The ``orders`` collection."""
        return self.get_database()["orders"]

    @property
    def reviews(self) -> AsyncIOMotorCollection:
        """The ``reviews`` collection."""
        return self.get_database()["reviews"]

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------

    async def ping(self) -> bool:
        """
        Lightweight health probe.

        Returns:
            ``True`` if the server responds to ``ping``, ``False`` otherwise.
        """
        if self._client is None:
            return False
        try:
            await self._client.admin.command("ping")
            return True
        except Exception:
            logger.warning("MongoDB health-check ping failed.", exc_info=True)
            return False

    async def health_report(self) -> Dict[str, Any]:
        """
        Return a detailed health report for the ``/health`` endpoint.

        Returns:
            A dict with connection status, database name, server version,
            and available collections.
        """
        report: Dict[str, Any] = {
            "connected": False,
            "database": settings.DATABASE_NAME,
        }

        if self._client is None:
            return report

        try:
            await self._client.admin.command("ping")
            report["connected"] = True
        except Exception:
            return report

        try:
            server_info = await self._client.server_info()
            report["server_version"] = server_info.get("version", "unknown")
        except Exception:
            report["server_version"] = "unknown"

        try:
            database = self.get_database()
            report["collections"] = sorted(await database.list_collection_names())
        except Exception:
            report["collections"] = []

        return report


# ======================================================================
# Singleton instance
# ======================================================================

db = Database()
"""Module-level singleton.  Import this everywhere."""


# ======================================================================
# FastAPI-friendly free functions (thin wrappers around the singleton)
# ======================================================================


async def connect_to_mongo() -> None:
    """Call during FastAPI startup / lifespan ``startup``."""
    await db.connect()


async def close_mongo_connection() -> None:
    """Call during FastAPI shutdown / lifespan ``shutdown``."""
    await db.disconnect()


async def ensure_collections() -> None:
    """Create required collections if they don't exist."""
    await db.ensure_collections()


def get_database() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency-injection compatible getter.

    Example::

        @router.get("/items")
        async def list_items(database = Depends(get_database)):
            ...
    """
    return db.get_database()


# ======================================================================
# Internal helpers
# ======================================================================


def _mask_url(url: str) -> str:
    """
    Redact credentials from a MongoDB connection string for safe logging.

    ``mongodb://user:s3cret@host:27017``  →  ``mongodb://***:***@host:27017``
    """
    try:
        from urllib.parse import urlparse, urlunparse

        parsed = urlparse(url)
        if parsed.username or parsed.password:
            netloc = f"***:***@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            return urlunparse(parsed._replace(netloc=netloc))
    except Exception:
        pass
    return url
