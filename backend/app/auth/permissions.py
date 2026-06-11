from __future__ import annotations

from typing import Literal

AuthRole = Literal["buyer", "manager", "broker", "crm_user", "admin"]

AUTH_ROLES: set[str] = {"buyer", "manager", "broker", "crm_user", "admin"}
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "buyer": ["buyer:read", "properties:shortlist", "tours:book", "offers:create"],
    "manager": ["manager:read", "manager:write", "listings:write", "crm:read", "tieups:approve"],
    "broker": ["broker:read", "broker:write", "propertypool:use", "tieups:request"],
    "crm_user": ["crm:read", "crm:write", "campaigns:write", "reports:read"],
    "admin": ["*"],
}


def sanitize_role(role: str | None) -> str:
    return role if role in AUTH_ROLES else "buyer"


def permissions_for_role(role: str) -> list[str]:
    return ROLE_PERMISSIONS.get(role, [])

