"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, MessageCircle, PhoneCall } from "lucide-react";
import {
  BookingResponse,
  LeadQualification,
  Property,
  DEFAULT_WHATSAPP_NUMBER,
  WhatsAppSendResult,
  createBooking,
  getBookingSlots,
  qualifyWhatsAppLead,
  sendWhatsAppMessage,
  triggerElevenLabsInterestCall,
  VoiceCallResult,
} from "@/lib/api";

type Slot = { time: string; available?: boolean };

export function ChannelAgentsPanel({ focused }: { focused: Property | null }) {
  const [leadMessage, setLeadMessage] = useState("Hi, I want a 2BHK in Powai or Andheri under 2.5 cr. Can I visit tomorrow?");
  const [whatsAppTo, setWhatsAppTo] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [whatsapp, setWhatsapp] = useState<LeadQualification | null>(null);
  const [whatsappSend, setWhatsappSend] = useState<WhatsAppSendResult | null>(null);
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [callPhone, setCallPhone] = useState("+919000002001");
  const [callConsent, setCallConsent] = useState(true);
  const [callResult, setCallResult] = useState<VoiceCallResult | null>(null);
  const [callBusy, setCallBusy] = useState(false);
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
    setWhatsAppSending(true);
    try {
      const lead = await qualifyWhatsAppLead({
        message: leadMessage,
        preferred_locality: focused?.locality,
        phone: whatsAppTo,
      });
      setWhatsapp(lead);
      const sendResult = await sendWhatsAppMessage({
        to: whatsAppTo,
        message: lead.suggested_reply,
        dry_run: false,
      });
      setWhatsappSend(sendResult);
    } finally {
      setWhatsAppSending(false);
    }
  }

  async function runCall() {
    if (!focused) return;
    setCallBusy(true);
    setCallResult(null);
    try {
      setCallResult(await triggerElevenLabsInterestCall({
        buyer_id: "buyer-channel-demo",
        buyer_name: "Demo Buyer",
        buyer_phone: callPhone,
        property_id: focused.id,
        interest_source: "Talk to Expert",
        consent_confirmed: callConsent,
        preferred_language: "Hinglish",
        trigger_reason: "Buyer asked channel assistant for a call about property details, EMI, and visit slots.",
        call_goal: "property_detail",
      }));
    } finally {
      setCallBusy(false);
    }
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
      <div className="rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
          <MessageCircle size={16} />
          WhatsApp assistant
        </p>
        <h2 className="mt-2 lx-display text-3xl font-light leading-none text-ink">Lead qualification and auto-reply</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/65">
          This sends a real outbound WhatsApp reply through Twilio from the site after lead qualification.
        </p>
        <input
          value={whatsAppTo}
          onChange={(event) => setWhatsAppTo(event.target.value)}
          placeholder="+918209979629"
          className="mt-4 w-full rounded-xl border border-ink/15 bg-ivory p-3 text-sm font-medium text-ink outline-none focus:border-gold"
        />
        <textarea
          value={leadMessage}
          onChange={(event) => setLeadMessage(event.target.value)}
          className="mt-3 min-h-32 w-full rounded-xl border border-ink/15 bg-ivory p-3 text-sm font-medium text-ink outline-none focus:border-gold"
        />
        <button onClick={runWhatsApp} disabled={whatsAppSending} className="mt-3 w-full rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#1d4ed8] disabled:opacity-50">
          Send WhatsApp reply
        </button>
        {whatsapp && (
          <div className="mt-4 rounded-xl border border-gold/45 bg-gold/10 p-4 text-sm font-semibold leading-6 text-[#1d4ed8]">
            <p className="font-semibold">Assistant response</p>
            <p className="mt-2">Lead score {whatsapp.lead_score}/100 - {whatsapp.intent}</p>
            <p className="mt-2">{whatsapp.suggested_reply}</p>
          </div>
        )}
        {whatsappSend && (
          <div className={`mt-4 rounded-xl border p-4 text-sm font-semibold leading-6 ${whatsappSend.sent ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <p className="font-semibold">Delivery status</p>
            <p className="mt-2">{whatsappSend.sent ? "Sent" : "Not sent"} | {whatsappSend.status || "unknown"}</p>
            <p className="mt-2">To: {whatsappSend.to}</p>
            {whatsappSend.sid ? <p className="mt-1">SID: {whatsappSend.sid}</p> : null}
            {!whatsappSend.sent && whatsappSend.message.includes("63016") ? (
              <p className="mt-2">Twilio 63016 means you are outside WhatsApp&apos;s 24-hour customer window. Send a new inbound WhatsApp message first, then retry.</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
          <PhoneCall size={16} />
          Call agent
        </p>
        <h2 className="mt-2 lx-display text-3xl font-light leading-none text-ink">Voice triage and handoff</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/65">
          ElevenLabs is now the primary provider. Mock mode records the call, transcript, CRM activity, and follow-up without spending credits.
        </p>
        <input
          value={callPhone}
          onChange={(event) => setCallPhone(event.target.value)}
          className="mt-4 w-full rounded-xl border border-ink/15 bg-ivory p-3 text-sm font-medium text-ink outline-none focus:border-gold"
          placeholder="+91 buyer phone"
        />
        <label className="mt-3 flex items-start gap-2 text-sm font-bold text-ink/65"><input type="checkbox" checked={callConsent} onChange={(event) => setCallConsent(event.target.checked)} className="mt-1" />Buyer consent confirmed for ASTRA AI call.</label>
        <button onClick={runCall} disabled={callBusy || !focused} className="mt-3 w-full rounded-xl bg-ink px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#1f2937] disabled:opacity-50">
          {callBusy ? "Starting call..." : "Trigger ElevenLabs call"}
        </button>
        {callResult && (
          <div className={`mt-4 rounded-xl border p-4 text-sm font-medium leading-6 ${
            callResult.call_status === "calling" || callResult.call_status === "completed"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : callResult.call_status === "failed" || callResult.call_status === "blocked"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-ink/12 bg-ivory text-ink/65"
          }`}>
            <p className="font-semibold text-ink">{callResult.provider} · {callResult.call_status} · {callResult.mode}</p>
            <p className="mt-2">{callResult.reason}</p>
            {callResult.call_id ? <p className="mt-2 text-xs font-semibold">Call ID: {callResult.call_id}</p> : null}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
          <CalendarCheck size={16} />
          Booking page
        </p>
        <h2 className="mt-2 lx-display text-3xl font-light leading-none text-ink">Viewing slots and booking</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/65">
          Slot suggestions are shown here now. Add Cal.com keys to turn this into live availability lookup and booking creation.
        </p>
        <div className="mt-4 grid gap-2">
          {slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => setSelectedSlot(slot.time)}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${
                selectedSlot === slot.time ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-ivory text-ink/65"
              }`}
            >
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(slot.time))}
            </button>
          ))}
        </div>
        <button onClick={bookSlot} disabled={!selectedSlot} className="mt-3 w-full rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#1d4ed8] disabled:opacity-50">
          Book viewing
        </button>
        {booking && (
          <div className="mt-4 rounded-xl border border-gold/45 bg-gold/10 p-4 text-sm font-semibold leading-6 text-[#1d4ed8]">
            <p className="font-semibold">Booking confirmed</p>
            <p>{booking.booking?.title}</p>
          </div>
        )}
      </div>
    </section>
  );
}
