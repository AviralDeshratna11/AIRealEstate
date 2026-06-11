from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.auth.permissions import sanitize_role
from app.db.session import get_pool


@dataclass
class CurrentUser:
    id: str
    auth_user_id: str
    email: str
    role: str
    full_name: str | None = None
    avatar_url: str | None = None
    phone: str | None = None
    onboarding_completed: bool = False
    organization_id: str | None = None
    profile_ids: dict[str, str | None] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
    is_mock: bool = False


MOCK_USERS: dict[str, CurrentUser] = {
    "buyer@astra.local": CurrentUser(id="mock-buyer", auth_user_id="mock-buyer", email="buyer@astra.local", role="buyer", full_name="ASTRA Buyer", onboarding_completed=True, is_mock=True),
    "manager@astra.local": CurrentUser(id="mock-manager", auth_user_id="mock-manager", email="manager@astra.local", role="manager", full_name="ASTRA Manager", onboarding_completed=True, is_mock=True),
    "broker@astra.local": CurrentUser(id="mock-broker", auth_user_id="mock-broker", email="broker@astra.local", role="broker", full_name="ASTRA Broker", onboarding_completed=True, is_mock=True),
    "crm@astra.local": CurrentUser(id="mock-crm", auth_user_id="mock-crm", email="crm@astra.local", role="crm_user", full_name="ASTRA CRM User", onboarding_completed=True, is_mock=True),
    "admin@astra.local": CurrentUser(id="mock-admin", auth_user_id="mock-admin", email="admin@astra.local", role="admin", full_name="ASTRA Admin", onboarding_completed=True, is_mock=True),
}


def mock_user_from_token(token: str) -> CurrentUser | None:
    if not token.startswith("mock:"):
        return None
    _, role, email = token.split(":", 2)
    user = MOCK_USERS.get(email)
    if not user:
        return None
    user.role = sanitize_role(role)
    return user


async def verify_token_with_supabase(token: str, supabase_url: str | None, api_key: str | None) -> dict[str, Any]:
    if not supabase_url or not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase token verification is not configured",
        )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{supabase_url.rstrip('/')}/auth/v1/user",
                headers={"apikey": api_key, "Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not verify Supabase session") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase session")

    user = response.json()
    metadata = user.get("user_metadata") or {}
    return {
        "sub": user.get("id"),
        "email": user.get("email"),
        "role": metadata.get("role"),
        "user_metadata": metadata,
        "app_metadata": user.get("app_metadata") or {},
    }


async def load_or_create_user_from_claims(claims: dict[str, Any]) -> CurrentUser:
    auth_user_id = claims.get("sub")
    email = claims.get("email")
    if not auth_user_id or not email:
        raise ValueError("Token does not contain required user claims")

    metadata = claims.get("user_metadata") or claims.get("app_metadata") or {}
    requested_role = sanitize_role(metadata.get("role") or claims.get("role"))
    pool = await get_pool()
    if pool is None:
        return CurrentUser(
            id=auth_user_id,
            auth_user_id=auth_user_id,
            email=email,
            role=requested_role,
            full_name=metadata.get("full_name"),
            avatar_url=metadata.get("avatar_url"),
            onboarding_completed=bool(metadata.get("onboarding_completed")),
            metadata=metadata,
        )

    row = await pool.fetchrow(
        """
        insert into app_users (auth_user_id, email, full_name, avatar_url, primary_role, last_login_at)
        values ($1, $2, $3, $4, $5, now())
        on conflict (auth_user_id) do update set
          email = excluded.email,
          full_name = coalesce(app_users.full_name, excluded.full_name),
          avatar_url = coalesce(excluded.avatar_url, app_users.avatar_url),
          last_login_at = now(),
          updated_at = now()
        returning *
        """,
        auth_user_id,
        email,
        metadata.get("full_name"),
        metadata.get("avatar_url"),
        requested_role,
    )
    return CurrentUser(
        id=str(row["id"]),
        auth_user_id=str(row["auth_user_id"]),
        email=row["email"],
        role=sanitize_role(row["primary_role"]),
        full_name=row["full_name"],
        avatar_url=row["avatar_url"],
        phone=row["phone"],
        onboarding_completed=row["onboarding_completed"],
        organization_id=str(row["organization_id"]) if row["organization_id"] else None,
        metadata=metadata,
    )


def user_payload(user: CurrentUser) -> dict[str, Any]:
    return {
        "id": user.id,
        "auth_user_id": user.auth_user_id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "phone": user.phone,
        "role": user.role,
        "primary_role": user.role,
        "onboarding_completed": user.onboarding_completed,
        "organization_id": user.organization_id,
        "profile_ids": user.profile_ids,
        "is_mock": user.is_mock,
    }
