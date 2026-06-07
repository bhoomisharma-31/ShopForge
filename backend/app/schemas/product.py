from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int = 10
    image: Optional[str] = None
    images: Optional[List[str]] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None

class ProductResponse(ProductBase):
    id: str
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime
