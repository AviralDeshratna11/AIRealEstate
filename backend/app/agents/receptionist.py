from __future__ import annotations

from app.services.calcom import CalComService


class ReceptionistAgent:
    def __init__(self) -> None:
        self.calcom = CalComService()

    async def handle(self, message: str) -> dict:
        q = message.lower()
        slots = await self.calcom.get_slots(days=7)
        if any(word in q for word in ["book", "schedule", "viewing", "visit", "tour"]):
            first_slot = slots[0] if slots else None
            return {
                "answer": (
                    "I can help book a property viewing. The earliest available slot I found is "
                    f"{first_slot.get('time', first_slot) if first_slot else 'not available right now'}. "
                    "Please share the buyer name, email, and preferred property to confirm."
                ),
                "slots": slots,
                "needs_followup": True,
            }
        return {
            "answer": "I can qualify the lead, answer property questions, and schedule a site visit. What property are they interested in?",
            "slots": slots[:3],
            "needs_followup": False,
        }
