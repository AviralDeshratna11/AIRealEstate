"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, MessageCircle, PhoneCall } from "lucide-react";
import {
  Property,
  createBooking,
  getBookingSlots,
  qualifyWhatsAppLead,
  simulateCallAgent,
} from "@/lib/api";

type Slot = { time: string; available?: boolean };

export function ChannelAgentsPanel({ focused }: { focused: Property | null }) {
  const [leadMessage, setLeadMessage] = useState("Hi, I want a 2BHK in Powai or Andheri under 2.5 cr. Can I visit tomorrow?");
  const [whatsapp, setWhatsapp] = useState<any>(null);
  const [callText, setCallText] = useState("Caller wants a site visit this weekend and asks about EMI for the focused property.");
  const [callResult, setCallResult] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [booking, setBooking] = useState<any>(null);

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
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-estate-700">
          <MessageCircle size={16} />
          WhatsApp assistant
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Lead qualification</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Demo mode scores the lead and drafts a reply. With WhatsApp credentials, this endpoint can sit behind a real webhook.
        </p>
        <textarea
          value={leadMessage}
          onChange={(event) => setLeadMessage(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-estate-500"
        />
        <button onClick={runWhatsApp} className="mt-3 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white">
          Run WhatsApp demo
        </button>
        {whatsapp && (
          <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-black">Score {whatsapp.lead_score}/100 - {whatsapp.intent}</p>
            <p className="mt-2">{whatsapp.suggested_reply}</p>
          </div>
        )}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-estate-700">
          <PhoneCall size={16} />
          Call agent
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Voice triage simulation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This simulates the same routing Vapi would hit. Real inbound/outbound voice needs Vapi webhook configuration.
        </p>
        <textarea
          value={callText}
          onChange={(event) => setCallText(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-estate-500"
        />
        <button onClick={runCall} className="mt-3 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white">
          Simulate call
        </button>
        {callResult && (
          <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
            <p className="font-black text-slate-950">{callResult.route}</p>
            <p className="mt-2">{callResult.answer}</p>
          </div>
        )}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-estate-700">
          <CalendarCheck size={16} />
          Booking page
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Viewing slots</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Demo slots appear without Cal.com. Add Cal.com keys to turn this into real slot lookup and booking creation.
        </p>
        <div className="mt-4 grid gap-2">
          {slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => setSelectedSlot(slot.time)}
              className={`rounded-md border px-3 py-2 text-left text-sm font-bold ${
                selectedSlot === slot.time ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(slot.time))}
            </button>
          ))}
        </div>
        <button onClick={bookSlot} disabled={!selectedSlot} className="mt-3 w-full rounded-md bg-estate-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
          Book demo viewing
        </button>
        {booking && (
          <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-black">Booking {booking.booking?.status}</p>
            <p>{booking.booking?.title}</p>
          </div>
        )}
      </div>
    </section>
  );
}
