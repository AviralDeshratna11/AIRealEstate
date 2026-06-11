from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status

from app.auth.jwt import verify_supabase_jwt
from app.auth.supabase_auth import CurrentUser, load_or_create_user_from_claims, mock_user_from_token, verify_token_with_supabase
from app.config import get_settings


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    settings = get_settings()
    if settings.auth_mock_mode:
        mock_user = mock_user_from_token(token)
        if mock_user:
            return mock_user

    if settings.supabase_jwt_secret:
        claims = verify_supabase_jwt(token, settings.supabase_jwt_secret)
    else:
        claims = await verify_token_with_supabase(
            token,
            settings.supabase_url,
            settings.supabase_anon_key or settings.supabase_service_role_key,
        )
    try:
        return await load_or_create_user_from_claims(claims)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def require_any_role(*roles: str) -> Callable[[CurrentUser], CurrentUser]:
    async def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role == "admin" or user.role in roles:
            return user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")

    return dependency


def require_role(role: str) -> Callable[[CurrentUser], CurrentUser]:
    return require_any_role(role)


require_admin = require_any_role("admin")
require_manager = require_any_role("manager")
require_broker = require_any_role("broker")
require_buyer = require_any_role("buyer")
