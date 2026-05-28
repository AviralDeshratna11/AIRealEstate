from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import assistant, agents, bookings, documents, finance, manager, market, negotiation, properties, tour, vapi, whatsapp
from app.config import get_settings
from app.db.session import close_pool

settings = get_settings()

app = FastAPI(
    title="ASTRA Estate Mumbai API",
    description="Mumbai-first multi-agent real estate transaction backend with FastAPI, LangGraph Command routing, pgvector, Vapi, WhatsApp, Cal.com, market intelligence, finance/material estimates, and OpenAI structured outputs.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if "https://*.vercel.app" in settings.cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router)
app.include_router(assistant.router)
app.include_router(bookings.router)
app.include_router(agents.router)
app.include_router(finance.router)
app.include_router(manager.router)
app.include_router(market.router)
app.include_router(tour.router)
app.include_router(negotiation.router)
app.include_router(documents.router)
app.include_router(vapi.router)
app.include_router(whatsapp.router)


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.environment, "market": "Mumbai", "agents": 10}


@app.on_event("shutdown")
async def shutdown_event():
    await close_pool()
