from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.db.mongodb import db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.security import get_current_admin_user
from bson import ObjectId
import datetime

router = APIRouter()

def serialize_product(product_doc) -> dict:
    return {
        "id": str(product_doc["_id"]),
        "name": product_doc["name"],
        "description": product_doc["description"],
        "price": float(product_doc["price"]),
        "category": product_doc["category"],
        "rating": float(product_doc.get("rating", 0.0)),
        "reviews_count": int(product_doc.get("reviews_count", 0)),
        "stock": int(product_doc.get("stock", 0)),
        "image": product_doc.get("image"),
        "images": product_doc.get("images", []),
        "created_at": product_doc.get("created_at") or datetime.datetime.now(datetime.timezone.utc)
    }

@router.get("", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    query = {}
    if category and category.lower() != "all":
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = db.products.find(query).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [serialize_product(d) for d in docs]

@router.get("/{id}", response_model=ProductResponse)
async def get_product(id: str):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID format."
        )
        
    product_doc = await db.products.find_one({"_id": oid})
    if not product_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
    return serialize_product(product_doc)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    product_doc = product_in.model_dump()
    product_doc["rating"] = 0.0
    product_doc["reviews_count"] = 0
    product_doc["created_at"] = datetime.datetime.now(datetime.timezone.utc)
    
    result = await db.products.insert_one(product_doc)
    product_doc["_id"] = result.inserted_id
    return serialize_product(product_doc)

@router.put("/{id}", response_model=ProductResponse)
async def update_product(
    id: str,
    product_in: ProductUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID format."
        )
        
    update_data = {k: v for k, v in product_in.model_dump().items() if v is not None}
    
    if not update_data:
        # Fetch current product details to return
        product_doc = await db.products.find_one({"_id": oid})
        if not product_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found."
            )
        return serialize_product(product_doc)
        
    result = await db.products.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
    return serialize_product(result)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID format."
        )
        
    result = await db.products.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
    return None
