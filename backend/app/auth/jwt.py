from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any

from fastapi import HTTPException, status


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def verify_supabase_jwt(token: str, jwt_secret: str | None) -> dict[str, Any]:
    if not jwt_secret:
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Supabase JWT secret is not configured")
    try:
        header_raw, payload_raw, signature_raw = token.split(".")
        header = json.loads(_b64url_decode(header_raw))
        payload = json.loads(_b64url_decode(payload_raw))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if header.get("alg") != "HS256":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unsupported JWT algorithm")

    signed = f"{header_raw}.{payload_raw}".encode("utf-8")
    expected = hmac.new(jwt_secret.encode("utf-8"), signed, hashlib.sha256).digest()
    received = _b64url_decode(signature_raw)
    if not hmac.compare_digest(expected, received):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    exp = payload.get("exp")
    if exp and int(exp) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return payload

