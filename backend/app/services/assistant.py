from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings


SYSTEM_PROMPT = """You are ASTRA Estate's assistant for a Mumbai real-estate platform.
Help buyers, brokers, and operators understand the app, choose workflows, form property
queries, interpret market/finance outputs, and prepare next actions. Be concise,
professional, practical, and transparent when something needs verification."""


async def answer_assistant(message: str, context: str, history: list[dict[str, str]]) -> dict[str, Any]:
    settings = get_settings()
    if settings.gemini_api_key:
        return await _answer_with_gemini(message, context, history)
    return _fallback_answer(message, context)


async def _answer_with_gemini(message: str, context: str, history: list[dict[str, str]]) -> dict[str, Any]:
    settings = get_settings()
    model = settings.gemini_model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    history_text = "\n".join(
        f"{item.get('role', 'user')}: {item.get('content', '')}" for item in history[-6:] if item.get("content")
    )
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Current app context: {context}\n"
        f"Recent conversation:\n{history_text or 'None'}\n\n"
        f"User question: {message}"
    )

    async with httpx.AsyncClient(timeout=20) as client:
      response = await client.post(
          url,
          headers={"x-goog-api-key": settings.gemini_api_key or "", "Content-Type": "application/json"},
          json={
              "contents": [{"role": "user", "parts": [{"text": prompt}]}],
              "generationConfig": {"temperature": 0.35, "maxOutputTokens": 700},
          },
      )
      response.raise_for_status()
      payload = response.json()

    answer = _extract_gemini_text(payload)
    return {"answer": answer or "I could not generate a useful answer for that request.", "provider": "gemini", "model": model, "configured": True}


def _extract_gemini_text(payload: dict[str, Any]) -> str:
    parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()


def _fallback_answer(message: str, context: str) -> dict[str, Any]:
    lower = message.lower()
    if any(word in lower for word in ["finance", "emi", "loan", "material"]):
        answer = "Open the Finance tab, select a focused property, then run the EMI and material estimate. It uses price, area, down payment, interest rate, and tenure."
    elif any(word in lower for word in ["document", "agreement", "pdf", "contingency"]):
        answer = "Use Docs & Deals to upload an agreement, inspection report, PDF, image, or text file. The document agent extracts parties, dates, contingencies, and risk notes."
    elif any(word in lower for word in ["map", "location", "locality", "pin"]):
        answer = "Use the Map tab to inspect locality pins. Selecting a listing keeps the map, finance, tour, and shortlist workflows aligned."
    elif any(word in lower for word in ["search", "find", "property", "listing"]):
        answer = "Use the Search tab and describe the buyer requirement naturally, such as budget, BHK, locality, metro access, inventory, or redevelopment upside."
    else:
        answer = f"I can help with ASTRA workflows from the {context} context: search, market intelligence, maps, finance, tours, documents, negotiation, and agent operations. Configure GEMINI_API_KEY for full LLM answers."
    return {"answer": answer, "provider": "local-fallback", "model": None, "configured": False}
