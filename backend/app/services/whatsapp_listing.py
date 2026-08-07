from __future__ import annotations

import base64
from typing import Any

import httpx
from pydantic import BaseModel, Field

from app.config import get_settings
from app.services.openai_client import get_openai_client

LISTING_SYSTEM_PROMPT = """
You read incoming WhatsApp messages for ASTRA Estate, a Mumbai real estate platform.
Decide whether the sender (a broker, builder, or property owner) is submitting a NEW property
for listing/sale on the platform, as opposed to a buyer asking to find a property, a general
question, or anything unrelated.

If it IS a listing submission, extract only facts stated or clearly implied in the message/image.
Never invent a price, area, or address that isn't present. Use null for anything not stated.
Prices are in INR; "cr"/"crore" = 1,00,00,000, "lakh"/"L" = 1,00,000.
locality must be a Mumbai Metropolitan Region place name (e.g. Powai, Andheri, Thane, Borivali).
"""


class WhatsAppListingExtraction(BaseModel):
    is_listing: bool = Field(description="True only if this message is a seller/broker submitting a property for listing")
    title: str | None = None
    locality: str | None = None
    property_type: str = "apartment"
    transaction_type: str = "sale"
    bedrooms: int | None = None
    bathrooms: int | None = None
    carpet_area_sqft: int | None = None
    asking_price: float | None = None
    possession_status: str | None = None
    furnishing_status: str | None = None
    builder: str | None = None
    owner_name: str | None = None
    owner_phone: str | None = None
    notes: str | None = None


# Approximate coordinates for common Mumbai Metropolitan Region localities, used to satisfy
# the manager listing pipeline's required lat/lng when a WhatsApp submission doesn't include them.
LOCALITY_COORDS: dict[str, tuple[float, float]] = {
    "powai": (19.1176, 72.9060), "andheri": (19.1197, 72.8468), "bandra": (19.0596, 72.8295),
    "borivali": (19.2321, 72.8567), "malad": (19.1874, 72.8484), "goregaon": (19.1663, 72.8526),
    "kandivali": (19.2094, 72.8697), "vile parle": (19.1003, 72.8442), "santacruz": (19.0808, 72.8410),
    "juhu": (19.1075, 72.8263), "worli": (19.0176, 72.8161), "parel": (18.9930, 72.8397),
    "dadar": (19.0178, 72.8478), "mahim": (19.0410, 72.8397), "sewri": (18.9930, 72.8570),
    "chembur": (19.0522, 72.8994), "ghatkopar": (19.0863, 72.9081), "kanjurmarg": (19.1290, 72.9370),
    "vikhroli": (19.1090, 72.9260), "mulund": (19.1726, 72.9425), "thane": (19.2183, 72.9781),
    "navi mumbai": (19.0330, 73.0297), "vashi": (19.0771, 72.9986), "kurla": (19.0728, 72.8826),
    "colaba": (18.9067, 72.8147), "fort": (18.9345, 72.8358), "byculla": (18.9762, 72.8327),
    "matunga": (19.0270, 72.8548), "sion": (19.0430, 72.8619), "wadala": (19.0170, 72.8570),
}
DEFAULT_COORDS = (19.0760, 72.8777)  # Mumbai city center fallback


def locality_coords(locality: str | None) -> tuple[float, float]:
    if not locality:
        return DEFAULT_COORDS
    key = locality.lower()
    for name, coords in LOCALITY_COORDS.items():
        if name in key:
            return coords
    return DEFAULT_COORDS


class WhatsAppListingService:
    async def extract(self, text: str, raw_images: list[bytes] | None = None) -> WhatsAppListingExtraction | None:
        client = get_openai_client()
        if not client:
            return None

        settings = get_settings()
        raw_images = raw_images or []
        content: list[dict[str, Any]] = [{"type": "text", "text": f"Incoming WhatsApp message:\n{text[:4000]}"}]
        for raw in raw_images:
            content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64.b64encode(raw).decode('utf-8')}"}})

        try:
            completion = await client.beta.chat.completions.parse(
                model=settings.openai_vision_model,
                messages=[
                    {"role": "system", "content": LISTING_SYSTEM_PROMPT},
                    {"role": "user", "content": content},
                ],
                response_format=WhatsAppListingExtraction,
            )
            return completion.choices[0].message.parsed
        except Exception:
            return None

    async def fetch_raw_images(self, urls: list[str]) -> list[bytes]:
        settings = get_settings()
        out: list[bytes] = []
        if not urls:
            return out
        auth = (settings.twilio_account_sid, settings.twilio_auth_token) if settings.twilio_account_sid else None
        # Twilio media URLs 307-redirect to a signed CDN link; httpx doesn't follow
        # redirects by default and raise_for_status() treats an unfollowed one as an error.
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            for url in urls[:3]:
                try:
                    response = await client.get(url, auth=auth)
                    response.raise_for_status()
                    out.append(response.content)
                except Exception:
                    continue
        return out


whatsapp_listing_service = WhatsAppListingService()
