from __future__ import annotations

import hashlib
import hmac
import time
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import httpx
from fastapi import HTTPException, Request

from app.agents.voice_calling_graph import build_voice_calling_graph
from app.config import get_settings
from app.crm_models import CRMActivityCreate
from app.services.call_context_builder import call_context_builder
from app.services.scheduler import scheduler_service
from app.services.crm_erp import crm_erp_service
from app.services.mumbai_market import monthly_emi
from app.voice_models import (
    BrokerBuyerCallRequest,
    ManualLeadCallRequest,
    VoiceCallConfig,
    VoiceCallConsent,
    VoiceCallRecord,
    VoiceInterestCallRequest,
    VoiceToolRequest,
    VoiceTriggerResult,
)


ELEVENLABS_AGENT_PROMPT = """You are ASTRA Voice Closer, a professional AI real estate calling assistant for Mumbai property buyers.
Clearly identify yourself as an AI assistant from ASTRA. Confirm this is a good time to talk. Explain only verified property details, ask qualification questions, offer site visit slots, offer WhatsApp follow-up, and escalate to a human when needed. Never reveal seller walk-away price, broker commission, or unverified legal clearance. Keep the call concise, polite, and useful."""


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}"


def _norm_phone(phone: str | None) -> str:
    value = "".join(ch for ch in str(phone or "") if ch.isdigit() or ch == "+")
    if value.startswith("91") and not value.startswith("+"):
        return f"+{value}"
    return value


class ElevenLabsCallingService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._records: dict[str, dict[str, Any]] = {}
        self._consents: dict[str, dict[str, Any]] = {}
        self._events: list[dict[str, Any]] = []
        self._tool_calls: list[dict[str, Any]] = []
        self._config_created_at = _utc_now()

    def config(self) -> VoiceCallConfig:
        return VoiceCallConfig(
            id="voice-config-elevenlabs",
            mode="live" if self.settings.elevenlabs_mode == "live" else "mock",
            elevenlabs_agent_id=self.settings.elevenlabs_agent_id,
            elevenlabs_phone_number_id=self.settings.elevenlabs_agent_phone_number_id,
            max_calls_per_day=self.settings.elevenlabs_max_calls_per_day,
            max_call_seconds=self.settings.elevenlabs_max_call_seconds,
            allowed_start_hour=self.settings.elevenlabs_allowed_call_start_hour,
            allowed_end_hour=self.settings.elevenlabs_allowed_call_end_hour,
            cooldown_hours=self.settings.elevenlabs_cooldown_hours,
            enabled=True,
            created_at=self._config_created_at,
            updated_at=_utc_now(),
        )

    async def trigger_interest_call(self, request: VoiceInterestCallRequest) -> VoiceTriggerResult:
        to_number = _norm_phone(request.buyer_phone or request.metadata.get("phone"))
        context = await call_context_builder.build(
            buyer_id=request.buyer_id,
            lead_id=request.lead_id,
            buyer_name=request.buyer_name,
            buyer_phone=to_number,
            property_id=request.property_id,
            preferred_language=request.preferred_language,
            source=request.interest_source,
            broker_id=request.broker_id,
        )
        state = await build_voice_calling_graph().ainvoke(
            {
                "buyer_id": request.buyer_id,
                "lead_id": request.lead_id,
                "property_id": request.property_id,
                "broker_id": request.broker_id,
                "manager_id": request.manager_id,
                "crm_opportunity_id": request.crm_opportunity_id,
                "trigger_source": request.interest_source,
                "trigger_reason": request.trigger_reason,
                "consent_status": "confirmed" if request.consent_confirmed else "missing",
                "call_goal": request.call_goal,
                "preferred_language": request.preferred_language,
                **context,
                "audit_events": [],
            }
        )
        blocked = self._blocked_reason(request, to_number, state)
        if blocked and not request.force_call:
            return VoiceTriggerResult(call_status="blocked", reason=blocked, mode=self.config().mode)
        crm_task_id = await self._create_crm_call_task(request, to_number)
        record = self._create_record(request, to_number, state, crm_task_id)
        if self.config().mode == "live":
            return await self._start_live_call(record, state, crm_task_id)
        return await self._complete_mock_call(record["id"], state, crm_task_id)

    async def manual_lead_call(self, lead_id: str, request: ManualLeadCallRequest) -> VoiceTriggerResult:
        leads = await crm_erp_service.leads()
        lead = next((item for item in leads if item.id == lead_id), None)
        if not lead:
            raise HTTPException(status_code=404, detail="CRM lead not found")
        return await self.trigger_interest_call(
            VoiceInterestCallRequest(
                buyer_id=lead_id,
                lead_id=lead_id,
                buyer_name=lead.full_name,
                buyer_phone=lead.phone,
                property_id=request.property_id,
                interest_source="CRM",
                consent_confirmed=request.force_call or True,
                preferred_language=request.preferred_language,
                trigger_reason=f"Sales manager requested {request.call_goal} call",
                call_goal=request.call_goal,
                force_call=request.force_call,
            )
        )

    async def broker_buyer_call(self, buyer_id: str, request: BrokerBuyerCallRequest) -> VoiceTriggerResult:
        # Demo permission gate: require broker id and property id, never expose commission in context.
        if not request.broker_id or not request.property_id:
            return VoiceTriggerResult(call_status="blocked", reason="Broker/property permission missing", mode=self.config().mode)
        return await self.trigger_interest_call(
            VoiceInterestCallRequest(
                buyer_id=buyer_id,
                buyer_name=f"Broker buyer {buyer_id[-4:]}",
                buyer_phone="+919000002001",
                property_id=request.property_id,
                interest_source="Broker portal",
                consent_confirmed=True,
                preferred_language=request.preferred_language,
                trigger_reason=f"Broker-triggered call with tie-up {request.tieup_id or 'demo'}",
                call_goal=request.call_goal,
                broker_id=request.broker_id,
                metadata={"tieup_id": request.tieup_id, "commission_hidden": True},
            )
        )

    def _blocked_reason(self, request: VoiceInterestCallRequest, to_number: str, state: dict[str, Any]) -> str | None:
        if not to_number or len(to_number) < 10:
            return "Missing or invalid buyer phone number"
        if not request.consent_confirmed:
            return "Buyer call consent is missing"
        consent = self._consent_for(to_number, request.buyer_id)
        if consent.get("opt_out"):
            return "Buyer has opted out of calls"
        if not self._within_calling_hours():
            return "Outside allowed calling hours: 10:00 AM to 7:00 PM IST"
        if self._daily_call_count() >= self.settings.elevenlabs_max_calls_per_day:
            return "ElevenLabs daily call budget reached"
        if self._cooldown_active(to_number, request.property_id):
            return "Call cooldown active for this buyer/property"
        if state.get("call_status") == "whatsapp_first":
            return state.get("next_action") or "Medium intent should receive WhatsApp before call"
        return None

    def _within_calling_hours(self) -> bool:
        now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        return self.settings.elevenlabs_allowed_call_start_hour <= now_ist.hour < self.settings.elevenlabs_allowed_call_end_hour

    def _daily_call_count(self) -> int:
        today = datetime.now(timezone.utc).date()
        return sum(1 for rec in self._records.values() if datetime.fromisoformat(rec["created_at"]).date() == today)

    def _cooldown_active(self, phone: str, property_id: str) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=self.settings.elevenlabs_cooldown_hours)
        for rec in self._records.values():
            if rec.get("to_number") == phone and rec.get("property_id") == property_id:
                created = datetime.fromisoformat(rec["created_at"])
                if created > cutoff:
                    return True
        return False

    def _consent_for(self, phone: str, buyer_id: str | None = None) -> dict[str, Any]:
        key = phone
        if key not in self._consents:
            self._consents[key] = VoiceCallConsent(id=_id("voice-consent"), buyer_id=buyer_id, phone=phone, consent_status="confirmed", consent_source="request", consent_timestamp=_utc_now(), created_at=_utc_now()).model_dump(mode="json")
        return self._consents[key]

    async def _create_crm_call_task(self, request: VoiceInterestCallRequest, to_number: str) -> str | None:
        try:
            activity = await crm_erp_service.create_activity(
                CRMActivityCreate(
                    lead_id=request.lead_id,
                    opportunity_id=request.crm_opportunity_id,
                    property_id=request.property_id,
                    activity_type="Call",
                    title=f"ASTRA Voice Closer call: {request.buyer_name or to_number}",
                    description=f"Goal: {request.call_goal}. Trigger: {request.trigger_reason}.",
                    priority="high",
                    created_by_agent=True,
                )
            )
            return activity.id
        except Exception:
            return None

    def _create_record(self, request: VoiceInterestCallRequest, to_number: str, state: dict[str, Any], crm_task_id: str | None) -> dict[str, Any]:
        record = VoiceCallRecord(
            id=_id("voice-call"),
            mode=self.config().mode,
            buyer_id=request.buyer_id,
            lead_id=request.lead_id,
            property_id=request.property_id,
            broker_id=request.broker_id,
            manager_id=request.manager_id,
            crm_opportunity_id=request.crm_opportunity_id,
            trigger_source=request.interest_source,
            trigger_reason=request.trigger_reason,
            call_goal=request.call_goal,
            to_number=to_number,
            status="calling" if self.config().mode == "live" else "mock_completed",
            created_at=_utc_now(),
            started_at=_utc_now(),
            intent_score=float(state.get("buyer_context", {}).get("lead_score") or 0),
            summary_json={"call_context": state, "crm_task_id": crm_task_id, "agent_prompt": ELEVENLABS_AGENT_PROMPT},
        ).model_dump(mode="json")
        self._records[record["id"]] = record
        self._events.append({"id": _id("voice-event"), "call_id": record["id"], "event_type": "call_created", "payload_json": {"source": request.interest_source}, "created_at": _utc_now()})
        consent = self._consent_for(to_number, request.buyer_id)
        consent["last_called_at"] = _utc_now()
        consent["calls_last_7_days"] = int(consent.get("calls_last_7_days") or 0) + 1
        consent["updated_at"] = _utc_now()
        return record

    def _elevenlabs_payload(self, record: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        dynamic_variables = {
            "buyer_name": state.get("buyer_context", {}).get("name"),
            "property_title": state.get("property_context", {}).get("title"),
            "locality": state.get("property_context", {}).get("locality"),
            "price": state.get("property_context", {}).get("price_label"),
            "bhk": state.get("property_context", {}).get("bhk"),
            "carpet_area": state.get("property_context", {}).get("carpet_area"),
            "visit_link": "/bookings",
            "preferred_language": state.get("preferred_language"),
            "crm_lead_id": record.get("lead_id"),
            "property_id": record.get("property_id"),
            "legal_status": state.get("property_context", {}).get("rera_status"),
            "next_action": state.get("next_action"),
            "max_call_seconds": self.settings.elevenlabs_max_call_seconds,
        }
        return {
            "agent_id": self.settings.elevenlabs_agent_id,
            "agent_phone_number_id": self.settings.elevenlabs_agent_phone_number_id,
            "to_number": record["to_number"],
            "conversation_initiation_client_data": {"dynamic_variables": dynamic_variables},
        }

    async def _start_live_call(self, record: dict[str, Any], state: dict[str, Any], crm_task_id: str | None) -> VoiceTriggerResult:
        if not self.settings.elevenlabs_api_key or not self.settings.elevenlabs_agent_id or not self.settings.elevenlabs_agent_phone_number_id:
            record["status"] = "failed"
            record["error_message"] = "ElevenLabs live mode missing API key, agent id, or phone number id"
            return VoiceTriggerResult(call_status="failed", call_id=record["id"], reason=record["error_message"], crm_task_id=crm_task_id, mode="live")
        payload = self._elevenlabs_payload(record, state)
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", headers={"xi-api-key": self.settings.elevenlabs_api_key, "Content-Type": "application/json"}, json=payload)
                response.raise_for_status()
                body = response.json()
                if body.get("success") is False:
                    record["status"] = "failed"
                    record["error_message"] = body.get("message") or "ElevenLabs outbound call was not started"
                    record["summary_json"]["provider_response"] = body
                    return VoiceTriggerResult(call_status="failed", call_id=record["id"], reason=record["error_message"], crm_task_id=crm_task_id, mode="live", payload_preview=payload)
                record["provider_call_id"] = body.get("call_id") or body.get("callSid") or body.get("id")
                record["provider_conversation_id"] = body.get("conversation_id")
                record["status"] = "calling"
                record["summary_json"]["provider_response"] = body
                return VoiceTriggerResult(call_status="calling", call_id=record["id"], reason="ElevenLabs outbound call started", crm_task_id=crm_task_id, scheduled_or_started="started", mode="live", payload_preview=payload)
            except httpx.HTTPError as exc:
                record["status"] = "failed"
                record["error_message"] = str(exc)
                return VoiceTriggerResult(call_status="failed", call_id=record["id"], reason=str(exc), crm_task_id=crm_task_id, mode="live", payload_preview=payload)

    async def _complete_mock_call(self, call_id: str, state: dict[str, Any], crm_task_id: str | None) -> VoiceTriggerResult:
        record = self._records[call_id]
        buyer = state.get("buyer_context", {}).get("name") or "Buyer"
        prop = state.get("property_context", {}).get("title") or "selected property"
        locality = state.get("property_context", {}).get("locality") or "Mumbai"
        transcript = f"ASTRA Voice Closer: Namaste {buyer}, main ASTRA ka AI property assistant bol raha hoon. Aapne {prop} in {locality} mein interest dikhaya tha. Buyer: Please send details and visit slots. ASTRA Voice Closer: I will send WhatsApp details and reserve a visit slot if you confirm."
        record.update(
            {
                "status": "mock_completed",
                "provider_call_id": f"mock-elevenlabs-{call_id}",
                "provider_conversation_id": f"mock-conv-{call_id}",
                "ended_at": _utc_now(),
                "duration_seconds": 96,
                "transcript": transcript,
                "summary_json": {
                    **record["summary_json"],
                    "summary": f"{buyer} is interested in {prop}, asked for details, and is open to visit scheduling.",
                    "buyer_updates": {"preferred_language": state.get("preferred_language"), "intent": "hot"},
                    "crm_updates": {"lead_score_delta": 8, "next_stage": "Visit Scheduled"},
                    "next_actions": ["Send WhatsApp summary", "Offer two visit slots", "Escalate if negotiation starts"],
                },
                "outcome": "wants_whatsapp_details",
                "intent_score": max(float(record.get("intent_score") or 0), 88),
                "next_action": "Send WhatsApp property summary and ask for visit slot confirmation",
                "updated_at": _utc_now(),
            }
        )
        self._events.append({"id": _id("voice-event"), "call_id": call_id, "event_type": "mock_call_completed", "payload_json": record["summary_json"], "created_at": _utc_now()})
        return VoiceTriggerResult(call_status="mock_completed", call_id=call_id, reason="Mock call completed without spending ElevenLabs credits", crm_task_id=crm_task_id, scheduled_or_started="mock_started", mode="mock", payload_preview=record["summary_json"].get("call_context", {}))

    async def webhook(self, request: Request) -> dict[str, Any]:
        body = await request.body()
        if self.settings.elevenlabs_webhook_secret:
            signature = request.headers.get("elevenlabs-signature") or request.headers.get("x-elevenlabs-signature") or request.headers.get("signature")
            if signature and not self._valid_webhook_signature(body, signature):
                raise HTTPException(status_code=401, detail="Invalid ElevenLabs webhook signature")
        payload = await request.json()
        event_type = str(payload.get("type") or payload.get("event") or payload.get("status") or "event")
        call_id = str(payload.get("call_id") or payload.get("metadata", {}).get("call_id") or payload.get("conversation_id") or _id("provider-event"))
        local = self._find_record(call_id)
        self._events.append({"id": _id("voice-event"), "call_id": local.get("id") if local else call_id, "event_type": event_type, "payload_json": payload, "created_at": _utc_now()})
        if local:
            if "transcript" in payload:
                local["transcript"] = payload["transcript"]
            if event_type in {"call_ended", "conversation_ended", "ended"}:
                local["status"] = "completed"
                local["ended_at"] = _utc_now()
                local["summary_json"] = {**local.get("summary_json", {}), "provider_event": payload}
                local["outcome"] = payload.get("outcome") or local.get("outcome") or "completed"
        return {"ok": True, "event_type": event_type, "call_id": local.get("id") if local else call_id}

    def _valid_webhook_signature(self, body: bytes, signature: str) -> bool:
        parts = dict(part.split("=", 1) for part in signature.split(",") if "=" in part)
        timestamp = parts.get("t")
        signed_hash = parts.get("v0")
        if timestamp and signed_hash:
            try:
                if int(timestamp) < int(time.time()) - 30 * 60:
                    return False
            except ValueError:
                return False
            signed_payload = f"{timestamp}.{body.decode('utf-8')}".encode("utf-8")
            expected = hmac.new(self.settings.elevenlabs_webhook_secret.encode(), signed_payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(signed_hash, expected)

        expected = hmac.new(self.settings.elevenlabs_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature.split(":")[-1], expected)

    def _find_record(self, provider_id: str) -> dict[str, Any] | None:
        return next((rec for rec in self._records.values() if provider_id in {rec.get("id"), rec.get("provider_call_id"), rec.get("provider_conversation_id")}), None)

    async def get_call(self, call_id: str) -> VoiceCallRecord:
        rec = self._find_record(call_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Voice call not found")
        return VoiceCallRecord(**rec)

    async def analytics(self) -> dict[str, Any]:
        records = list(self._records.values())
        today = datetime.now(timezone.utc).date()
        calls_today = [rec for rec in records if datetime.fromisoformat(rec["created_at"]).date() == today]
        week_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        calls_week = [rec for rec in records if datetime.fromisoformat(rec["created_at"]) >= week_cutoff]
        visits = sum(1 for rec in records if rec.get("outcome") == "visit_booked")
        return {
            "calls_today": len(calls_today),
            "calls_this_week": len(calls_week),
            "estimated_credits_used": sum(int(rec.get("duration_seconds") or 0) for rec in records),
            "remaining_call_budget": max(0, self.settings.elevenlabs_max_calls_per_day - len(calls_today)),
            "conversion_from_calls": round(visits / max(len(records), 1), 2),
            "visits_booked_from_calls": visits,
            "mode": self.config().mode,
        }

    async def tool_get_property_details(self, request: VoiceToolRequest) -> dict[str, Any]:
        context = await call_context_builder.build(buyer_id=request.buyer_id, lead_id=request.lead_id, buyer_name=None, buyer_phone=None, property_id=request.property_id or "seller-demo-powai-1")
        return {"property_summary": context["property_context"], "verified_details": context["property_context"], "missing_details": context["safety_context"]["missing_documents"], "allowed_claims": ["price", "locality", "BHK", "area", "RERA if present", "availability if present"]}

    async def tool_calculate_emi(self, request: VoiceToolRequest) -> dict[str, Any]:
        context = await call_context_builder.build(buyer_id=request.buyer_id, lead_id=request.lead_id, buyer_name=None, buyer_phone=None, property_id=request.property_id or "seller-demo-powai-1")
        price = float(context["property_context"].get("price") or 0)
        down = float(request.down_payment or price * 0.2)
        loan = max(0, price - down)
        emi = monthly_emi(loan, request.interest_rate, request.tenure_years)
        return {"loan_amount": loan, "monthly_emi": emi, "total_estimated_upfront_cost": down, "affordability_note": "Indicative only. Final EMI depends on lender approval."}

    async def tool_get_visit_slots(self, request: VoiceToolRequest) -> dict[str, Any]:
        return {"available_slots": await scheduler_service.get_slots(days=5), "event_type": "property-viewing", "booking_rules": ["Confirm buyer phone", "Send WhatsApp confirmation", "Do not overbook manager"]}

    async def tool_book_site_visit(self, request: VoiceToolRequest) -> dict[str, Any]:
        booking = await scheduler_service.create_booking(request.attendee_name or "Demo Buyer", "buyer@example.com", request.slot or _utc_now(), request.property_id or "Selected property")
        return {"booking_confirmation": True, "cal_booking_id": booking.get("id"), "visit_details": booking}

    async def tool_send_whatsapp_summary(self, request: VoiceToolRequest) -> dict[str, Any]:
        return {"message_status": "mock_prepared", "message_preview": f"Here is the {request.summary_type} for property {request.property_id}. Reply YES to schedule a visit."}

    async def tool_escalate_human(self, request: VoiceToolRequest) -> dict[str, Any]:
        activity = await crm_erp_service.create_activity(CRMActivityCreate(lead_id=request.lead_id, property_id=request.property_id, activity_type="Internal task", title=f"Human escalation: {request.reason or 'buyer requested human'}", priority="high", created_by_agent=True))
        return {"escalation_id": activity.id, "assigned_user": "sales-manager-demo", "next_step": "Manager should call buyer within 30 minutes"}

    async def tool_update_crm_lead(self, request: VoiceToolRequest) -> dict[str, Any]:
        return {"crm_update_status": "recorded", "intent_score": request.intent_score, "next_action": request.next_action}

    async def tool_opt_out(self, request: VoiceToolRequest) -> dict[str, Any]:
        phone = _norm_phone(request.buyer_phone)
        consent = self._consent_for(phone)
        consent["opt_out"] = True
        consent["opt_out_reason"] = request.reason or "buyer requested opt-out"
        consent["updated_at"] = _utc_now()
        return {"opt_out_status": "opted_out", "phone": phone}


elevenlabs_calling_service = ElevenLabsCallingService()
