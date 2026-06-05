from __future__ import annotations

import asyncio

from app.services.elevenlabs_service import ElevenLabsCallingService
from app.voice_models import VoiceInterestCallRequest, VoiceToolRequest


def run(coro):
    return asyncio.run(coro)


def voice_service() -> ElevenLabsCallingService:
    service = ElevenLabsCallingService()
    service.settings.elevenlabs_mode = "mock"
    return service


def test_interest_call_mock_mode_force_completes():
    service = voice_service()
    result = run(service.trigger_interest_call(
        VoiceInterestCallRequest(
            buyer_id="buyer-test-1",
            buyer_name="Rahul Test",
            buyer_phone="+919000001111",
            property_id="seller-demo-powai-1",
            interest_source="Talk to Expert",
            consent_confirmed=True,
            force_call=True,
        )
    ))
    assert result.call_status == "mock_completed"
    assert result.call_id
    record = run(service.get_call(result.call_id))
    assert record.transcript
    assert record.provider == "elevenlabs"


def test_consent_missing_blocks_call():
    service = voice_service()
    result = run(service.trigger_interest_call(
        VoiceInterestCallRequest(
            buyer_id="buyer-test-2",
            buyer_phone="+919000002222",
            property_id="seller-demo-powai-1",
            interest_source="Talk to Expert",
            consent_confirmed=False,
        )
    ))
    assert result.call_status == "blocked"
    assert "consent" in result.reason.lower()


def test_cooldown_blocks_repeated_call():
    service = voice_service()
    first = run(service.trigger_interest_call(
        VoiceInterestCallRequest(
            buyer_id="buyer-test-3",
            buyer_phone="+919000003333",
            property_id="seller-demo-powai-1",
            interest_source="Talk to Expert",
            consent_confirmed=True,
            force_call=True,
        )
    ))
    assert first.call_status == "mock_completed"
    second = run(service.trigger_interest_call(
        VoiceInterestCallRequest(
            buyer_id="buyer-test-3",
            buyer_phone="+919000003333",
            property_id="seller-demo-powai-1",
            interest_source="Talk to Expert",
            consent_confirmed=True,
        )
    ))
    assert second.call_status == "blocked"
    assert "cooldown" in second.reason.lower() or "hours" in second.reason.lower()


def test_tool_calculate_emi_has_legal_finance_caution():
    service = voice_service()
    result = run(service.tool_calculate_emi(VoiceToolRequest(property_id="seller-demo-powai-1", down_payment=5_000_000)))
    assert result["monthly_emi"] is not None
    assert "Indicative" in result["affordability_note"]


def test_opt_out_blocks_future_calls():
    service = voice_service()
    run(service.tool_opt_out(VoiceToolRequest(buyer_phone="+919000004444", reason="stop calling")))
    result = run(service.trigger_interest_call(
        VoiceInterestCallRequest(
            buyer_id="buyer-test-4",
            buyer_phone="+919000004444",
            property_id="seller-demo-powai-1",
            interest_source="Talk to Expert",
            consent_confirmed=True,
        )
    ))
    assert result.call_status == "blocked"
    assert "opted out" in result.reason.lower()
