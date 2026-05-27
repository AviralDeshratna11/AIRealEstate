"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, MessageCircle, PhoneCall } from "lucide-react";
import {
  AgentRunResult,
  BookingResponse,
  LeadQualification,
  Property,
  createBooking,
  getBookingSlots,
  qualifyWhatsAppLead,
  simulateCallAgent,
} from "@/lib/api";

type Slot = { time: string; available?: boolean };

export function ChannelAgentsPanel({ focused }: { focused: Property | null }) {
  const [leadMessage, setLeadMessage] = useState("Hi, I want a 2BHK in Powai or Andheri under 2.5 cr. Can I visit tomorrow?");
  const [whatsapp, setWhatsapp] = useState<LeadQualification | null>(null);
  const [callText, setCallText] = useState("Caller wants a site visit this weekend and asks about EMI for the focused property.");
  const [callResult, setCallResult] = useState<AgentRunResult | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  useEffect(() => {
    getBookingSlots().then((items) => {
      setSlots(items);
      setSelectedSlot(items[0]?.time || "");
    });
  }, []);

  async function runWhatsApp() {
    setWhatsapp(await qualifyWhatsAppLead({ message: leadMessage, preferred_locality: focused?.locality }));
  }

  async function runCall() {
    setCallResult(await simulateCallAgent(callText));
  }

  async function bookSlot() {
    if (!selectedSlot) return;
    setBooking(await createBooking({
      name: "Demo Buyer",
      email: "buyer@example.com",
      start_time: selectedSlot,
      property_title: focused?.title || "Selected Mumbai property",
    }));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker flex items-center gap-2">
          <MessageCircle size={16} />
          WhatsApp assistant
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none text-ink">Lead qualification</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
          Demo mode scores the lead and drafts a reply. With WhatsApp credentials, this endpoint can sit behind a real webhook.
        </p>
        <textarea
          value={leadMessage}
          onChange={(event) => setLeadMessage(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-md border border-ink/15 bg-[#fffaf0] p-3 text-sm font-medium text-ink outline-none focus:border-coral"
        />
        <button onClick={runWhatsApp} className="mt-3 w-full rounded-md bg-coral px-4 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5">
          Run WhatsApp demo
        </button>
        {whatsapp && (
          <div className="mt-4 rounded-md border border-peacock/20 bg-[#eef8f6] p-4 text-sm font-semibold leading-6 text-peacock">
            <p className="font-black">Score {whatsapp.lead_score}/100 - {whatsapp.intent}</p>
            <p className="mt-2">{whatsapp.suggested_reply}</p>
          </div>
        )}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker flex items-center gap-2">
          <PhoneCall size={16} />
          Call agent
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none text-ink">Voice triage simulation</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
          This simulates the same routing Vapi would hit. Real inbound/outbound voice needs Vapi webhook configuration.
        </p>
        <textarea
          value={callText}
          onChange={(event) => setCallText(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-md border border-ink/15 bg-[#fffaf0] p-3 text-sm font-medium text-ink outline-none focus:border-coral"
        />
        <button onClick={runCall} className="mt-3 w-full rounded-md bg-ink px-4 py-3 text-sm font-black text-[#fffaf0] shadow-crisp transition hover:-translate-y-0.5">
          Simulate call
        </button>
        {callResult && (
          <div className="mt-4 rounded-md border border-ink/12 bg-white/62 p-4 text-sm font-medium leading-6 text-ink/62">
            <p className="font-black text-ink">{callResult.route}</p>
            <p className="mt-2">{callResult.answer}</p>
          </div>
        )}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker flex items-center gap-2">
          <CalendarCheck size={16} />
          Booking page
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none text-ink">Viewing slots</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
          Demo slots appear without Cal.com. Add Cal.com keys to turn this into real slot lookup and booking creation.
        </p>
        <div className="mt-4 grid gap-2">
          {slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => setSelectedSlot(slot.time)}
              className={`rounded-md border px-3 py-2 text-left text-sm font-bold ${
                selectedSlot === slot.time ? "border-ink bg-ink text-[#fffaf0]" : "border-ink/15 bg-white/62 text-ink/66"
              }`}
            >
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(slot.time))}
            </button>
          ))}
        </div>
        <button onClick={bookSlot} disabled={!selectedSlot} className="mt-3 w-full rounded-md bg-peacock px-4 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5 disabled:opacity-50">
          Book demo viewing
        </button>
        {booking && (
          <div className="mt-4 rounded-md border border-peacock/20 bg-[#eef8f6] p-4 text-sm font-semibold leading-6 text-peacock">
            <p className="font-black">Booking {booking.booking?.status}</p>
            <p>{booking.booking?.title}</p>
          </div>
        )}
      </div>
    </section>
  );
}
