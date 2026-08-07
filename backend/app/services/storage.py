from __future__ import annotations

import mimetypes
from uuid import uuid4

import httpx

from app.config import get_settings

BUCKET = "listing-media"


class StorageService:
    """Uploads listing photos to a public Supabase Storage bucket. Returns None (never
    raises) when Supabase isn't configured or the upload fails, so callers can degrade
    gracefully instead of losing the whole listing submission over a bad photo."""

    async def upload(self, content: bytes, filename: str, folder: str = "listings") -> str | None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_role_key:
            return None

        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
        path = f"{folder}/{uuid4().hex[:16]}.{ext}"
        url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{BUCKET}/{path}"

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    url,
                    headers={
                        "apikey": settings.supabase_service_role_key,
                        "Authorization": f"Bearer {settings.supabase_service_role_key}",
                        "Content-Type": content_type,
                    },
                    content=content,
                )
                response.raise_for_status()
        except Exception:
            return None

        return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{BUCKET}/{path}"


storage_service = StorageService()
