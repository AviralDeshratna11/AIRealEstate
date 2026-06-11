from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user, require_admin
from app.auth.permissions import AUTH_ROLES, permissions_for_role, sanitize_role
from app.auth.supabase_auth import CurrentUser, user_payload
from app.db.session import get_pool

router = APIRouter(prefix="/api/auth", tags=["auth"])


class ProfileUpsert(BaseModel):
    role: str = Field(default="buyer")
    full_name: str | None = None
    phone: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class RoleSelect(BaseModel):
    role: str


@router.get("/me")
async def me(user: CurrentUser = Depends(get_current_user)):
    return user_payload(user)


@router.get("/permissions")
async def permissions(user: CurrentUser = Depends(get_current_user)):
    return {"role": user.role, "permissions": permissions_for_role(user.role)}


@router.post("/select-role")
async def select_role(payload: RoleSelect, user: CurrentUser = Depends(get_current_user)):
    role = sanitize_role(payload.role)
    if payload.role == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role cannot be self-assigned")
    pool = await get_pool()
    if pool is not None and not user.is_mock:
        existing = await pool.fetchrow("select primary_role, onboarding_completed from app_users where id = $1", user.id)
        if existing and existing["onboarding_completed"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role can only be selected during onboarding")
        await pool.execute("update app_users set primary_role = $1, updated_at = now() where id = $2", role, user.id)
        await pool.execute(
            "insert into user_roles (app_user_id, role) values ($1, $2) on conflict do nothing",
            user.id,
            role,
        )
    user.role = role
    return user_payload(user)


@router.post("/profile")
async def upsert_profile(payload: ProfileUpsert, user: CurrentUser = Depends(get_current_user)):
    role = sanitize_role(payload.role)
    if payload.role == "admin" and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role cannot be self-assigned")

    pool = await get_pool()
    if pool is None or user.is_mock:
        user.role = role
        user.full_name = payload.full_name or user.full_name
        user.phone = payload.phone or user.phone
        user.onboarding_completed = True
        return user_payload(user)

    await pool.execute(
        """
        update app_users
        set full_name = coalesce($1, full_name),
            phone = coalesce($2, phone),
            primary_role = $3,
            onboarding_completed = true,
            whatsapp_consent = coalesce(($4->>'whatsapp_consent')::boolean, whatsapp_consent),
            call_consent = coalesce(($4->>'call_consent')::boolean, call_consent),
            email_marketing_consent = coalesce(($4->>'email_marketing_consent')::boolean, email_marketing_consent),
            preferred_contact_channel = coalesce($4->>'preferred_contact_channel', preferred_contact_channel),
            preferred_language = coalesce($4->>'preferred_language', preferred_language),
            do_not_call = coalesce(($4->>'do_not_call')::boolean, do_not_call),
            do_not_message = coalesce(($4->>'do_not_message')::boolean, do_not_message),
            updated_at = now()
        where id = $5
        """,
        payload.full_name,
        payload.phone,
        role,
        payload.metadata,
        user.id,
    )
    await pool.execute("insert into user_roles (app_user_id, role) values ($1, $2) on conflict do nothing", user.id, role)
    await _create_role_profile(pool, user, role, payload)
    await pool.execute(
        "insert into auth_audit_logs (app_user_id, event_type, details_json) values ($1, 'onboarding_completed', $2)",
        user.id,
        {"role": role},
    )
    user.role = role
    user.full_name = payload.full_name or user.full_name
    user.phone = payload.phone or user.phone
    user.onboarding_completed = True
    return user_payload(user)


@router.post("/logout-audit")
async def logout_audit(request: Request, user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    if pool is not None and not user.is_mock:
        await pool.execute(
            """
            insert into auth_audit_logs (app_user_id, event_type, ip_address, user_agent, details_json)
            values ($1, 'logout', $2, $3, '{}'::jsonb)
            """,
            user.id,
            request.client.host if request.client else None,
            request.headers.get("user-agent"),
        )
    return {"ok": True}


@router.post("/admin/users/{app_user_id}/role")
async def admin_change_role(app_user_id: str, payload: RoleSelect, _: CurrentUser = Depends(require_admin)):
    role = sanitize_role(payload.role)
    if payload.role not in AUTH_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    pool = await get_pool()
    if pool is None:
        return {"app_user_id": app_user_id, "role": role, "mock": True}
    await pool.execute("update app_users set primary_role = $1, updated_at = now() where id = $2", role, app_user_id)
    return {"app_user_id": app_user_id, "role": role}


async def _create_role_profile(pool: Any, user: CurrentUser, role: str, payload: ProfileUpsert) -> None:
    metadata = payload.metadata
    if role == "buyer":
        await pool.execute(
            """
            insert into buyer_profiles (app_user_id, full_name, phone, email, preferences, budget, localities)
            values ($1, $2, $3, $4, $5, $6, $7)
            on conflict (app_user_id) do update set full_name = excluded.full_name, phone = excluded.phone, preferences = excluded.preferences, updated_at = now()
            """,
            user.id,
            payload.full_name or user.full_name or user.email,
            payload.phone,
            user.email,
            metadata,
            metadata.get("budget_range") or metadata.get("budget"),
            [v.strip() for v in (metadata.get("preferred_localities") or "").split(",") if v.strip()],
        )
    elif role == "manager":
        await pool.execute(
            """
            insert into manager_profiles (app_user_id, user_id, full_name, company_name, phone, email, operating_localities)
            values ($1, $1, $2, $3, $4, $5, $6)
            on conflict (app_user_id) do update set full_name = excluded.full_name, company_name = excluded.company_name, phone = excluded.phone, updated_at = now()
            """,
            user.id,
            payload.full_name or user.full_name or user.email,
            metadata.get("company_name") or metadata.get("company") or "ASTRA Manager",
            payload.phone,
            user.email,
            [v.strip() for v in (metadata.get("operating_localities") or "").split(",") if v.strip()],
        )
    elif role == "broker":
        await pool.execute(
            """
            insert into broker_profiles (app_user_id, user_id, full_name, agency_name, phone, email, whatsapp_number, rera_agent_id, operating_localities, years_experience, buyer_network_size, specialization)
            values ($1, $1, $2, $3, coalesce($4, ''), $5, $6, $7, $8, coalesce(($9)::int, 0), coalesce(($10)::int, 0), $11)
            on conflict (app_user_id) do update set full_name = excluded.full_name, agency_name = excluded.agency_name, phone = excluded.phone, updated_at = now()
            """,
            user.id,
            payload.full_name or user.full_name or user.email,
            metadata.get("agency_name") or "ASTRA Broker",
            payload.phone,
            user.email,
            metadata.get("whatsapp_number"),
            metadata.get("rera_agent_id"),
            [v.strip() for v in (metadata.get("operating_localities") or "").split(",") if v.strip()],
            metadata.get("years_of_experience") or "0",
            metadata.get("buyer_network_size") or "0",
            [v.strip() for v in (metadata.get("specialization") or "").split(",") if v.strip()],
        )
