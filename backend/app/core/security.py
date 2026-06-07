"""
ShopForge — Security & Authentication

Provides password hashing (bcrypt), JWT token creation / verification,
and FastAPI dependency-injection helpers for extracting the current user
from incoming requests.

Usage:
    from app.core.security import (
        hash_password,
        verify_password,
        create_access_token,
        get_current_user,
        get_current_active_user,
        get_current_admin_user,
    )
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.db.mongodb import db

logger = logging.getLogger(__name__)

# ======================================================================
# OAuth2 scheme  (tokenUrl points to the login endpoint)
# ======================================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
)

# ======================================================================
# Password hashing  (bcrypt via passlib)
# ======================================================================

_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(plain_password: str) -> str:
    """
    Return a bcrypt hash of *plain_password*.

    Args:
        plain_password: The raw password string to hash.

    Returns:
        The resulting bcrypt hash string.
    """
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify *plain_password* against *hashed_password*.

    Args:
        plain_password:  Raw password provided by the user.
        hashed_password: Stored bcrypt hash from the database.

    Returns:
        ``True`` if the password matches, ``False`` otherwise.
    """
    return _pwd_context.verify(plain_password, hashed_password)


# ======================================================================
# JWT helpers
# ======================================================================


def create_access_token(
    subject: str,
    *,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject:        Token subject — typically the user's ID (str).
        extra_claims:   Optional extra payload fields (e.g. ``{"role": "admin"}``).
        expires_delta:  Custom lifetime.  Falls back to
                        ``settings.ACCESS_TOKEN_EXPIRE_MINUTES``.

    Returns:
        An encoded JWT string.
    """
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_delta,
    }

    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Args:
        token: The encoded JWT string.

    Returns:
        The decoded payload dictionary.

    Raises:
        HTTPException 401: If the token is expired, malformed, or
                           the signature is invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as exc:
        logger.debug("JWT decode failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# ======================================================================
# FastAPI dependencies
# ======================================================================


async def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> Dict[str, Any]:
    """
    Decode the JWT bearer token, look up the user in MongoDB, and return
    the full user document.

    Raises:
        HTTPException 401: Invalid / expired token or user not found.
    """
    payload = decode_access_token(token)

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject ('sub').",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ------------------------------------------------------------------
    # Fetch user from MongoDB
    # ------------------------------------------------------------------
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.users.find_one({"_id": oid})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert ObjectId to string for downstream serialisation.
    user["id"] = str(user.pop("_id"))
    return user


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ensure the authenticated user's account is active (not disabled).

    Raises:
        HTTPException 403: If the account has been deactivated.
    """
    if current_user.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact support.",
        )
    return current_user


async def get_current_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Ensure the authenticated user has the ``admin`` role.

    Raises:
        HTTPException 403: If the user is not an admin.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    return current_user
