from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import hash_password, verify_password, create_access_token
from app.db.mongodb import db
from app.schemas.user import UserCreate, TokenResponse, UserResponse
from bson import ObjectId

router = APIRouter()

def serialize_user(user_doc) -> dict:
    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "role": user_doc.get("role", "customer"),
        "is_active": user_doc.get("is_active", True)
    }

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserCreate):
    # Check if user already exists
    existing = await db.users.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Hash password and insert user
    hashed = hash_password(user_in.password)
    user_doc = {
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": hashed,
        "role": "customer",
        "is_active": True
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    user_data = serialize_user(user_doc)
    token = create_access_token(
        subject=user_data["id"],
        extra_claims={"role": user_data["role"]}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_doc = await db.users.find_one({"email": form_data.username})
    if not user_doc or not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )
    
    user_data = serialize_user(user_doc)
    token = create_access_token(
        subject=user_data["id"],
        extra_claims={"role": user_data["role"]}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }
