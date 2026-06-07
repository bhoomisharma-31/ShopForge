from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.mongodb import db
from app.schemas.order import OrderCreate, OrderResponse
from app.core.security import get_current_active_user
from bson import ObjectId
import datetime

router = APIRouter()

def serialize_order(order_doc) -> dict:
    return {
        "id": str(order_doc["_id"]),
        "user_id": str(order_doc["user_id"]),
        "items": [
            {
                "product_id": str(item["product_id"]),
                "name": item["name"],
                "price": float(item["price"]),
                "quantity": int(item["quantity"]),
            }
            for item in order_doc["items"]
        ],
        "total": float(order_doc["total"]),
        "status": order_doc.get("status", "pending"),
        "created_at": order_doc.get("created_at") or datetime.datetime.now(datetime.timezone.utc)
    }

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    current_user: dict = Depends(get_current_active_user)
):
    # Reduce stock for products
    for item in order_in.items:
        try:
            prod_oid = ObjectId(item.product_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid product ID format: {item.product_id}"
            )
            
        prod = await db.products.find_one({"_id": prod_oid})
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.name} not found."
            )
        if prod.get("stock", 0) < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {item.name}. Available: {prod.get('stock')}"
            )
            
        # Update stock
        await db.products.update_one(
            {"_id": prod_oid},
            {"$inc": {"stock": -item.quantity}}
        )

    order_doc = {
        "user_id": current_user["id"],
        "items": [item.model_dump() for item in order_in.items],
        "total": order_in.total,
        "status": "pending",
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    }
    
    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id
    return serialize_order(order_doc)

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    current_user: dict = Depends(get_current_active_user)
):
    cursor = db.orders.find({"user_id": current_user["id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [serialize_order(d) for d in docs]
