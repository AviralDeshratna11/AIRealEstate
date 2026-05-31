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
  runVoiceGuide,
  VoiceGuideResult,
} from "@/lib/api";

type Slot = { time: string; available?: boolean };

export function ChannelAgentsPanel({ focused }: { focused: Property | null }) {
  const [leadMessage, setLeadMessage] = useState("Hi, I want a 2BHK in Powai or Andheri under 2.5 cr. Can I visit tomorrow?");
  const [whatsAppTo, setWhatsAppTo] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [whatsapp, setWhatsapp] = useState<LeadQualification | null>(null);
  const [whatsappSend, setWhatsappSend] = useState<WhatsAppSendResult | null>(null);
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [callText, setCallText] = useState("Caller wants a site visit this weekend and asks about EMI for the focused property.");
  const [callResult, setCallResult] = useState<VoiceGuideResult | null>(null);
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
    setCallResult(await runVoiceGuide({ message: callText, propertyId: focused?.id }));
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
        <h2 className="mt-2 font-display text-3xl font-black leading-none text-ink">Lead qualification and auto-reply</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
          This sends a real outbound WhatsApp reply through Twilio from the site after lead qualification.
        </p>
        <input
          value={whatsAppTo}
          onChange={(event) => setWhatsAppTo(event.target.value)}
          placeholder="+918209979629"
          className="mt-4 w-full rounded-md border border-ink/15 bg-[#fffaf0] p-3 text-sm font-medium text-ink outline-none focus:border-coral"
        />
        <textarea
          value={leadMessage}
          onChange={(event) => setLeadMessage(event.target.value)}
          className="mt-3 min-h-32 w-full rounded-md border border-ink/15 bg-[#fffaf0] p-3 text-sm font-medium text-ink outline-none focus:border-coral"
        />
        <button onClick={runWhatsApp} disabled={whatsAppSending} className="mt-3 w-full rounded-md bg-coral px-4 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5 disabled:opacity-50">
          Send WhatsApp reply
        </button>
        {whatsapp && (
          <div className="mt-4 rounded-md border border-peacock/20 bg-[#eef8f6] p-4 text-sm font-semibold leading-6 text-peacock">
            <p className="font-black">Assistant response</p>
            <p className="mt-2">Lead score {whatsapp.lead_score}/100 - {whatsapp.intent}</p>
            <p className="mt-2">{whatsapp.suggested_reply}</p>
          </div>
        )}
        {whatsappSend && (
          <div className={`mt-4 rounded-md border p-4 text-sm font-semibold leading-6 ${whatsappSend.sent ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <p className="font-black">Delivery status</p>
            <p className="mt-2">{whatsappSend.sent ? "Sent" : "Not sent"} | {whatsappSend.status || "unknown"}</p>
            <p className="mt-2">To: {whatsappSend.to}</p>
            {whatsappSend.sid ? <p className="mt-1">SID: {whatsappSend.sid}</p> : null}
            {!whatsappSend.sent && whatsappSend.message.includes("63016") ? (
              <p className="mt-2">Twilio 63016 means you are outside WhatsApp&apos;s 24-hour customer window. Send a new inbound WhatsApp message first, then retry.</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker flex items-center gap-2">
          <PhoneCall size={16} />
          Call agent
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none text-ink">Voice triage and handoff</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
          This calls the live XR voice guide endpoint, which is the same decision logic used by the Vapi voice route.
        </p>
        <textarea
          value={callText}
          onChange={(event) => setCallText(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-md border border-ink/15 bg-[#fffaf0] p-3 text-sm font-medium text-ink outline-none focus:border-coral"
        />
        <button onClick={runCall} className="mt-3 w-full rounded-md bg-ink px-4 py-3 text-sm font-black text-[#fffaf0] shadow-crisp transition hover:-translate-y-0.5">
          Run voice triage
        </button>
        {callResult && (
          <div className="mt-4 rounded-md border border-ink/12 bg-white/62 p-4 text-sm font-medium leading-6 text-ink/62">
            <p className="font-black text-ink">{callResult.response_type}</p>
            <p className="mt-2">{callResult.spoken_text}</p>
          </div>
        )}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker flex items-center gap-2">
          <CalendarCheck size={16} />
          Booking page
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none text-ink">Viewing slots and booking</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
          Slot suggestions are shown here now. Add Cal.com keys to turn this into live availability lookup and booking creation.
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
          Book viewing
        </button>
        {booking && (
          <div className="mt-4 rounded-md border border-peacock/20 bg-[#eef8f6] p-4 text-sm font-semibold leading-6 text-peacock">
            <p className="font-black">Booking confirmed</p>
            <p>{booking.booking?.title}</p>
          </div>
        )}
      </div>
    </section>
  );
}
