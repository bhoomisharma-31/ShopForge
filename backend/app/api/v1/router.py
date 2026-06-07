from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.products import router as products_router
from app.api.v1.endpoints.orders import router as orders_router
from app.api.v1.endpoints.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
