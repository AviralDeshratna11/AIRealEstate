"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import {
  BadgeCheck,
  Bot,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  ImageIcon,
  IndianRupee,
  Layers3,
  MapPin,
  Network,
  PhoneCall,
  Play,
  Route,
  Scale,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  X,
} from "lucide-react";
import type { PropertyIntelligenceDetail } from "@/lib/api";
import { askPropertyAI, formatCr, formatInr, getPropertyIntelligence, runPropertyAction, triggerElevenLabsInterestCall, type VoiceCallResult } from "@/lib/api";
import { FutureRadarCard } from "@/components/radar/FutureRadarCard";

type Role = PropertyIntelligenceDetail["role"];

const tabs = [
  ["about", "About the Home"],
  ["ai", "AI Summary"],
  ["amenities", "Amenities"],
  ["area", "Floor Plan and Area"],
  ["vastu", "Vastu Chart"],
  ["price", "Price Breakdown"],
  ["finance", "Finance and EMI"],
  ["legal", "Legal and Documents"],
  ["environment", "Sunlight, Ventilation and Noise"],
  ["map", "Map and Location"],
  ["future-radar", "Future Radar"],
  ["market", "Market Intelligence"],
  ["tour", "Tour Guide"],
  ["similar", "Similar Properties"],
  ["feedback", "Reviews / Visit Feedback"],
  ["broker", "Broker and PropertyPool"],
] as const;

export function PropertyIntelligencePage({ propertyId, role = "public" }: { propertyId: string; role?: Role }) {
  const [data, setData] = useState<PropertyIntelligenceDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [question, setQuestion] = useState("Is this property good for a family?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [callPhone, setCallPhone] = useState("+919000002001");
  const [callConsent, setCallConsent] = useState(true);
  const [callLanguage, setCallLanguage] = useState<"English" | "Hindi" | "Hinglish">("Hinglish");
  const [voiceCall, setVoiceCall] = useState<VoiceCallResult | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    getPropertyIntelligence(propertyId, role).then(setData).catch(console.error);
  }, [propertyId, role]);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#ffffff] px-5 py-10 text-ink">
        <div className="mx-auto max-w-5xl rounded-xl border border-ink/12 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-gold">Property Intelligence</p>
          <h1 className="mt-3 text-4xl font-black">Loading Mumbai property intelligence...</h1>
        </div>
      </main>
    );
  }

  const listing = data.listing;
  const hero = data.media.find((item) => item.is_hero) || data.media[0];
  const heroUrl = String(hero?.media_url || hero?.thumbnail_url || listing.hero_image_url || "");
  const title = listing.seo_title || listing.title;

  async function onAction(label: string) {
    if (!data) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const action = slug.includes("tie") ? "broker_request_tieup" : slug.includes("propertypool") ? "broker_create_propertypool" : slug.includes("schedule") || slug.includes("book") ? "schedule_visit" : slug.includes("shortlist") ? "shortlist" : slug.includes("compare") ? "compare" : slug.includes("document") ? "request_documents" : slug.includes("offer") || slug.includes("negotiation") ? "generate_negotiation" : "ask_ai";
    if (action === "ask_ai") {
      document.getElementById("ask-ai")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(label);
    try {
      const result = await runPropertyAction(data.id, action, { role, label });
      setActionMessage(String(result.message || `${label} recorded.`));
    } finally {
      setBusy(null);
    }
  }

  async function onAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    setBusy("ask");
    try {
      const result = await askPropertyAI(data.id, question, role);
      setAnswer(`${result.agent}: ${result.answer}`);
    } finally {
      setBusy(null);
    }
  }

  async function onVoiceCall(goal: "property_detail" | "visit_scheduling" = "property_detail") {
    if (!data) return;
    setBusy("voice-call");
    try {
      const result = await triggerElevenLabsInterestCall({
        buyer_id: "buyer-demo-property-page",
        buyer_name: "Demo Buyer",
        buyer_phone: callPhone,
        property_id: data.id,
        interest_source: goal === "visit_scheduling" ? "Schedule Visit" : "Talk to Expert",
        consent_confirmed: callConsent,
        preferred_language: callLanguage,
        trigger_reason: goal === "visit_scheduling" ? "Buyer clicked Schedule Visit but wants help booking" : "Buyer clicked Talk to AI Property Expert",
        call_goal: goal,
        metadata: { page: "property_detail", role },
      });
      setVoiceCall(result);
      setActionMessage(`${result.provider} ${result.mode} call: ${result.reason}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-ink">
      <div className="mx-auto max-w-[1520px] px-4 py-4 md:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-black text-ink/60">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-ink/12 bg-white px-3 py-2"><Home size={15} />Home</Link>
            <Link href="/workspace" className="rounded-xl border border-ink/12 bg-white px-3 py-2">Buyer OS</Link>
            <Link href="/broker" className="rounded-xl border border-ink/12 bg-white px-3 py-2">Broker OS</Link>
            <Link href="/manager" className="rounded-xl border border-ink/12 bg-white px-3 py-2">Manager OS</Link>
          </div>
          <span className="rounded-full bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">{role} view</span>
        </div>

        <section className="grid gap-3 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="group relative min-h-[420px] cursor-pointer overflow-hidden rounded-xl bg-ink" onClick={() => setGalleryIndex(0)}>
            {heroUrl ? <Image src={heroUrl} alt={String(hero?.caption || title)} fill sizes="(min-width: 1024px) 70vw, 100vw" unoptimized className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <MediaFallback />}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/82 to-transparent p-5 text-white">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-goldsoft">{String(hero?.room_name || "Living Area")}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">{String(hero?.room_area_sqft || 295)} SQ FT</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-white/78">{String(hero?.caption || "Morning light, open view")}</p>
            </div>
            {data.media_warning ? <div className="absolute left-5 top-5 rounded-xl bg-amber-100 px-4 py-2 text-sm font-black text-amber-950">{data.media_warning}</div> : null}
            <div className="absolute right-5 top-5 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
              <HeroButton icon={ImageIcon} label="View all photos" onClick={() => setGalleryIndex(0)} />
              <HeroButton icon={Play} label="Watch video tour" />
              <HeroButton icon={Route} label="Start AI guided tour" />
              <Link href={`/properties/${data.id}/xr`} className="inline-flex items-center gap-2 rounded-xl bg-goldsoft px-3 py-2 text-xs font-black text-ink shadow-lg">
                <Sparkles size={14} />
                Open XR tour
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[...data.media.slice(1, 4), ...Array(Math.max(0, 3 - data.media.slice(1, 4).length)).fill(null)].map((item, index) => {
              const isLastTile = index === 2;
              const remaining = data.media.length - 4;
              return (
                <button
                  key={index}
                  onClick={() => setGalleryIndex(item ? index + 1 : 0)}
                  className="relative min-h-[132px] overflow-hidden rounded-xl bg-ink text-left"
                >
                  {item?.media_url || item?.thumbnail_url ? <Image src={String(item.media_url || item.thumbnail_url)} alt={String(item.caption || "Property media")} fill sizes="(min-width: 1024px) 30vw, 33vw" unoptimized className="object-cover" /> : <MediaFallback small />}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 text-white">
                    <p className="text-xs font-black">{String(item?.room_name || ["Floor plan", "Bedroom", "Building"][index])}</p>
                    <p className="text-xs text-white/68">{String(item?.caption || "Needs manager confirmation.")}</p>
                  </div>
                  {isLastTile && remaining > 0 && (
                    <div className="absolute inset-0 grid place-items-center bg-ink/60 text-2xl font-black text-white">+{remaining} photos</div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {galleryIndex !== null && <PhotoGalleryModal media={data.media} initialIndex={galleryIndex} title={title} onClose={() => setGalleryIndex(null)} />}

        <section className="mt-5 rounded-xl border border-ink/12 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">{listing.building_name || `Unit ${listing.unit_number || "303/04"}`}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
              <p className="mt-2 text-sm font-semibold text-ink/60">{listing.locality}, Mumbai - {listing.property_type} - {listing.transaction_type} - {listing.status}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {data.facts.map((fact) => <Fact key={fact.label} label={fact.label} value={fact.value} />)}
              </div>
              {data.highlights && data.highlights.length > 0 ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {data.highlights.map((point) => (
                    <li key={point} className="flex items-start gap-2 rounded-xl border border-gold/15 bg-gold/10 px-3 py-2 text-sm font-semibold text-ink/70">
                      <Star size={15} className="mt-0.5 shrink-0 text-gold" />{point}
                    </li>
                  ))}
                </ul>
              ) : null}
              {data.google_map_link ? (
                <a href={data.google_map_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-black text-ink/70 transition hover:bg-ink hover:text-white">
                  <MapPin size={14} /> View on Google Maps
                </a>
              ) : null}
            </div>
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Asking price</p>
              <p className="mt-2 text-4xl font-black text-ink">{formatCr(listing.asking_price)}</p>
              <p className="mt-2 text-sm font-semibold text-ink/60">{formatInr(listing.price_per_sqft)} / sq ft - Updated {listing.updated_at ? new Date(listing.updated_at).toLocaleDateString("en-IN") : "recently"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-black text-ink/70">No false legal claims</span>
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-black text-ink/70">AI confidence {data.ai_summary.confidence_score}%</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {data.badges.map((badge) => <Badge key={badge.label} badge={badge} />)}
          </div>

          <div className="sticky top-0 z-20 mt-5 rounded-xl border border-ink/12 bg-white/95 p-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <ActionButton label="Talk to AI Property Expert" loading={busy === "voice-call"} onClick={() => onVoiceCall("property_detail")} />
              <ActionButton label="Call me with visit slots" loading={busy === "voice-call"} onClick={() => onVoiceCall("visit_scheduling")} />
              {data.actions.map((label) => <ActionButton key={label} label={label} loading={busy === label} onClick={() => onAction(label)} />)}
            </div>
            {actionMessage ? <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-sm font-bold text-gold">{actionMessage}</p> : null}
          </div>
        </section>

        <nav className="sticky top-0 z-10 mt-4 overflow-x-auto rounded-xl border border-ink/12 bg-[#f9fafb]/95 px-3 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="flex min-w-max gap-2">
            {tabs.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-xl px-3 py-2 text-xs font-black text-ink/60 transition hover:bg-ink hover:text-white">{label}</a>)}
          </div>
        </nav>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Section id="about" icon={Building2} title="About the Home" eyebrow="Buyer-facing story">
              <p className="text-lg font-semibold leading-8 text-ink/70">{listing.description_short || "Needs manager confirmation."}</p>
              <p className="mt-4 leading-8 text-ink/60">{listing.description_long || "Needs manager confirmation."}</p>
              <ChipGrid items={[...data.ai_summary.best_for, "Things to verify: documents, noise, floor plan", "Different because: AI pricing, finance, legal, tour, and broker workflows are connected"]} />
            </Section>

            <Section id="ai" icon={Bot} title="AI Summary" eyebrow="Property intelligence card">
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="text-lg font-bold leading-8 text-ink/85">{data.ai_summary.why_consider}</p>
                  <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-semibold leading-7 text-amber-950">{data.ai_summary.final_recommendation}</p>
                </div>
                <Score label="Confidence" value={data.ai_summary.confidence_score} />
              </div>
              <ThreeLists aTitle="Strengths" a={data.ai_summary.strengths} bTitle="Concerns" b={data.ai_summary.concerns} cTitle={role === "broker" ? "Broker talking points" : "Buyer questions"} c={role === "broker" ? data.ai_summary.broker_talking_points : data.ai_summary.buyer_questions} />
            </Section>

            <Section id="amenities" icon={Star} title="Amenities" eyebrow="Verified and known only">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(data.amenities).map(([group, items]) => <InfoList key={group} title={group} items={items.length ? items : ["Unknown - not shown as available"]} />)}
              </div>
            </Section>

            <Section id="area" icon={Layers3} title="Floor Plan and Area" eyebrow="Room-wise layout intelligence">
              <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-ink/20 bg-ivory p-5 text-center">
                  <div>
                    <Layers3 className="mx-auto text-ink/35" size={42} />
                    <p className="mt-3 text-sm font-black text-ink/70">Floor plan image/PDF</p>
                    <p className="mt-1 text-sm text-ink/50">View floor plan when uploaded</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.area.rooms.map((room) => <Fact key={room.room_name} label={room.room_name} value={`${room.area_sqft} sq ft - ${room.verified_status}`} />)}
                </div>
              </div>
              <p className="mt-4 text-sm font-bold text-amber-800">{data.area.message || data.area.room_flow_explanation}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Score label="Area efficiency" value={data.area.area_efficiency_score} />
                <Score label="Layout quality" value={data.area.layout_quality_score} />
                <Score label="Family suitability" value={data.area.family_suitability} />
              </div>
            </Section>

            <Section id="vastu" icon={Scale} title="Vastu Chart" eyebrow="Optional directional data">
              <EmptyState text={String(data.vastu.message || "Vastu information not provided.")} />
            </Section>

            <Section id="price" icon={IndianRupee} title="Price Breakdown" eyebrow="Transparent Mumbai pricing">
              <MetricGrid data={data.price_breakdown} money />
            </Section>

            <Section id="finance" icon={Calculator} title="Finance and EMI" eyebrow="Buyer affordability">
              <MetricGrid data={data.finance} money />
              <ChipGrid items={(data.finance.warnings as string[] | undefined) || []} />
            </Section>

            <Section id="legal" icon={ShieldAlert} title="Legal and Documents" eyebrow="Trust-first legal clarity">
              <p className="rounded-xl bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-950">{String(data.documents.ai_legal_summary || "Legal verification incomplete. Professional legal review recommended.")}</p>
              <MetricGrid data={data.documents} />
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton label="Request Documents" onClick={() => onAction("Request Documents")} />
                <ActionButton label="Ask Legal Agent" onClick={() => setQuestion("What are the legal risks?")} />
                <ActionButton label="Download Document Summary" onClick={() => onAction("Request Documents")} />
              </div>
            </Section>

            <Section id="environment" icon={Sun} title="Sunlight, Ventilation and Noise" eyebrow="Site quality signals">
              <MetricGrid data={data.environment} />
            </Section>

            <Section id="map" icon={MapPin} title="Map and Location" eyebrow="OpenStreetMap location">
              <PropertyPointMap lat={Number(data.map.latitude)} lng={Number(data.map.longitude)} title={listing.title} locality={listing.locality} />
              <p className="mt-3 text-sm font-semibold text-amber-800">{data.map.fallback_label}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {data.map.nearby.map((poi, index) => <Fact key={index} label={String(poi.type || "POI")} value={String(poi.name || poi.distance || "Mock fallback")} />)}
              </div>
            </Section>

            <section id="future-radar" className="scroll-mt-24">
              <FutureRadarCard propertyId={data.id} localityName={listing.locality} role={role} />
            </section>

            <Section id="market" icon={Search} title="Market Intelligence" eyebrow="Mumbai-first signals">
              <MetricGrid data={data.market_intelligence} />
              <p className="mt-4 rounded-xl bg-ink p-4 text-sm font-semibold leading-7 text-white">{String(data.market_intelligence.ai_explanation || "")}</p>
            </Section>

            <Section id="tour" icon={Route} title="Tour Guide" eyebrow="Room-by-room visit route">
              <div className="grid gap-3 md:grid-cols-2">
                {(data.tour_route.waypoints || []).map((item) => <RouteCard key={item.label} label={item.label} focus={item.focus} />)}
              </div>
              {data.tour_route.broker_script ? <p className="mt-4 rounded-xl bg-gold/10 p-4 text-sm font-bold leading-7 text-gold">{data.tour_route.broker_script}</p> : null}
            </Section>

            <Section id="similar" icon={Search} title="Similar Properties" eyebrow="Comparable buyer matches">
              <div className="grid gap-4 lg:grid-cols-2">
                {data.similar_properties.map((item) => <SimilarCard key={item.id} item={item} />)}
              </div>
            </Section>

            <Section id="feedback" icon={ClipboardList} title="Reviews / Visit Feedback" eyebrow="Private-safe visit intelligence">
              <MetricGrid data={data.visit_feedback} />
            </Section>

            <Section id="broker" icon={Network} title="Broker and PropertyPool" eyebrow="Role-aware distribution">
              <MetricGrid data={data.broker_propertypool} money />
            </Section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <ContactCard listing={listing} price={formatCr(listing.asking_price)} onSchedule={() => onVoiceCall("visit_scheduling")} />

            <section id="ask-ai" className="rounded-xl border border-ink/12 bg-ink p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-gold/30"><Bot size={16} />Ask AI Property Assistant</div>
              <form onSubmit={onAsk} className="mt-4 space-y-3">
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} className="min-h-28 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm font-semibold text-white outline-none placeholder:text-white/50" />
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-black text-ivory hover:bg-[#1d4ed8]"><Send size={16} />{busy === "ask" ? "Routing..." : "Ask property agent"}</button>
              </form>
              {answer ? <p className="mt-4 rounded-xl bg-white/10 p-4 text-sm font-semibold leading-7 text-white/84">{answer}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Is the price fair?", "What should I verify?", "Generate a negotiation offer.", "Can I bring my buyers?"].map((item) => <button key={item} onClick={() => setQuestion(item)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/78">{item}</button>)}
              </div>
            </section>

            <section className="rounded-xl border border-gold/20 bg-gold/5 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-gold"><PhoneCall size={16} />ASTRA Voice Closer</div>
              <h3 className="mt-2 text-2xl font-black text-ink">Get an ElevenLabs AI call</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/70">Mock mode is credit-safe. Live calls only start when `ELEVENLABS_MODE=live` and keys are configured.</p>
              <input value={callPhone} onChange={(event) => setCallPhone(event.target.value)} className="mt-4 w-full rounded-xl border border-ink/15 bg-white p-3 text-sm font-bold text-ink outline-none focus:border-gold" placeholder="+91 phone number" />
              <select value={callLanguage} onChange={(event) => setCallLanguage(event.target.value as "English" | "Hindi" | "Hinglish")} className="mt-3 w-full rounded-xl border border-ink/15 bg-white p-3 text-sm font-bold text-ink outline-none focus:border-gold">
                <option>Hinglish</option>
                <option>Hindi</option>
                <option>English</option>
              </select>
              <label className="mt-3 flex items-start gap-2 text-sm font-bold text-ink/70"><input type="checkbox" checked={callConsent} onChange={(event) => setCallConsent(event.target.checked)} className="mt-1" />I consent to receive an AI call from ASTRA about this property.</label>
              <button onClick={() => onVoiceCall("property_detail")} disabled={busy === "voice-call"} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-black text-ivory hover:bg-[#1d4ed8] disabled:opacity-60"><PhoneCall size={16} />{busy === "voice-call" ? "Starting..." : "Call me with details"}</button>
              {voiceCall ? <div className="mt-4 rounded-xl bg-white p-4 text-sm font-bold leading-6 text-ink/70"><p className="text-ink">{voiceCall.call_status} · {voiceCall.mode}</p><p className="mt-1">{voiceCall.reason}</p>{voiceCall.call_id ? <p className="mt-1 text-xs">Call ID: {voiceCall.call_id}</p> : null}</div> : null}
            </section>

            <section className="rounded-xl border border-ink/12 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Agent routes</p>
              <div className="mt-4 space-y-2">
                {data.agent_routes.map((agent) => <div key={agent} className="flex items-center gap-2 rounded-xl border border-ink/12 bg-ivory px-3 py-2 text-sm font-black text-ink/70"><Sparkles size={14} className="text-gold" />{agent}</div>)}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ContactCard({
  listing,
  price,
  onSchedule,
}: {
  listing: PropertyIntelligenceDetail["listing"];
  price: string;
  onSchedule: () => void;
}) {
  const name = listing.owner_name || "ASTRA Sales Team";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="rounded-xl border border-ink/12 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold text-lg font-black text-ivory">{initials || "AS"}</div>
        <div className="min-w-0">
          <p className="truncate text-base font-black text-ink">{name}</p>
          <p className="text-xs font-semibold text-ink/50">Listing contact - {price}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {listing.owner_phone ? (
          <a href={`tel:${listing.owner_phone}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-black text-ivory transition hover:bg-[#1d4ed8]">
            <PhoneCall size={16} />
            {listing.owner_phone}
          </a>
        ) : (
          <button onClick={onSchedule} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-black text-ivory transition hover:bg-[#1d4ed8]">
            <PhoneCall size={16} />
            Request a callback
          </button>
        )}
        <button onClick={onSchedule} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm font-black text-ink transition hover:bg-ivory">
          Request a tour
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] font-semibold text-ink/40">By contacting, you agree ASTRA may share your details with the listing team.</p>
    </section>
  );
}

function HeroButton({ icon: Icon, label, onClick }: { icon: typeof ImageIcon; label: string; onClick?: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl bg-white/92 px-3 py-2 text-xs font-black text-ink shadow-lg transition hover:bg-white"><Icon size={14} />{label}</button>;
}

function PhotoGalleryModal({
  media,
  initialIndex,
  title,
  onClose,
}: {
  media: PropertyIntelligenceDetail["media"];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, media.length - 1)));
  const current = media[index];
  const currentUrl = current ? String(current.media_url || current.thumbnail_url || "") : "";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, media.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [media.length, onClose]);

  if (!media.length) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex flex-col bg-ink/95" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between gap-4 p-4 text-white">
        <p className="text-sm font-black">{title} - Photo {index + 1} of {media.length}</p>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
          <X size={18} />
        </button>
      </div>

      <div className="relative flex-1 px-4 pb-4">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
          {currentUrl ? (
            <Image src={currentUrl} alt={String(current?.caption || title)} fill sizes="100vw" unoptimized className="object-contain" />
          ) : (
            <MediaFallback />
          )}
        </div>
        {index > 0 && (
          <button onClick={() => setIndex((i) => Math.max(i - 1, 0))} className="absolute left-7 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:bg-white">
            <ChevronLeft size={20} />
          </button>
        )}
        {index < media.length - 1 && (
          <button onClick={() => setIndex((i) => Math.min(i + 1, media.length - 1))} className="absolute right-7 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:bg-white">
            <ChevronRight size={20} />
          </button>
        )}
        {Boolean(current?.room_name || current?.caption) && (
          <div className="absolute bottom-8 left-1/2 max-w-lg -translate-x-1/2 rounded-xl bg-ink/80 px-4 py-2 text-center text-sm font-semibold text-white backdrop-blur">
            {String(current?.room_name || "")}{current?.room_name && current?.caption ? " - " : ""}{String(current?.caption || "")}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto p-4">
        {media.map((item, i) => {
          const url = String(item.media_url || item.thumbnail_url || "");
          return (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={clsx("relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition", i === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100")}
            >
              {url ? <Image src={url} alt="" fill sizes="96px" unoptimized className="object-cover" /> : <div className="h-full w-full bg-white/10" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MediaFallback({ small = false }: { small?: boolean }) {
  return <div className={clsx("grid h-full w-full place-items-center bg-ink/85 text-white", small ? "min-h-[132px]" : "min-h-[420px]")}><div className="text-center"><ImageIcon className="mx-auto opacity-60" size={small ? 28 : 48} /><p className="mt-2 text-sm font-black">Media pending from manager.</p></div></div>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-ink/12 bg-ivory p-4"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-ink/50">{label}</p><p className="mt-2 text-lg font-black text-ink">{value}</p></div>;
}

function Badge({ badge }: { badge: { label: string; status: string; detail: string } }) {
  const tone = badge.status === "positive" ? "border-gold/30 bg-gold/10 text-gold" : badge.status === "missing" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-orange-200 bg-orange-50 text-orange-950";
  const Icon = badge.status === "positive" ? ShieldCheck : ShieldAlert;
  return <div className={clsx("rounded-xl border p-4", tone)}><div className="flex items-center gap-2"><Icon size={16} /><p className="text-sm font-black">{badge.label}</p></div><p className="mt-1 text-xs font-semibold opacity-75">{badge.detail}</p></div>;
}

function ActionButton({ label, onClick, loading }: { label: string; onClick?: () => void; loading?: boolean }) {
  const primary = ["Talk to an Expert", "Schedule a Visit", "Request Tie-Up", "Create PropertyPool", "Run AI Review", "Talk to AI Property Expert", "Call me with visit slots"].includes(label);
  return <button onClick={onClick} className={clsx("inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5", primary ? "bg-gold text-ivory hover:bg-[#1d4ed8]" : "border border-ink/12 bg-white text-ink/70")}><CheckCircle2 size={15} />{loading ? "Working..." : label}</button>;
}

function Section({ id, icon: Icon, title, eyebrow, children }: { id: string; icon: typeof Home; title: string; eyebrow: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-28 rounded-xl border border-ink/12 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-gold">{eyebrow}</p><h3 className="mt-2 text-3xl font-black tracking-tight text-ink">{title}</h3></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink text-white"><Icon size={20} /></span></div>{children}</section>;
}

function ChipGrid({ items }: { items: string[] }) {
  return <div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full bg-gold/10 px-3 py-2 text-xs font-black text-gold">{item}</span>)}</div>;
}

function ThreeLists({ aTitle, a, bTitle, b, cTitle, c }: { aTitle: string; a: string[]; bTitle: string; b: string[]; cTitle: string; c: string[] }) {
  return <div className="mt-5 grid gap-4 md:grid-cols-3"><InfoList title={aTitle} items={a} /><InfoList title={bTitle} items={b} /><InfoList title={cTitle} items={c} /></div>;
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-xl border border-ink/12 bg-ivory p-4"><p className="text-sm font-black text-ink">{title}</p><div className="mt-3 space-y-2">{items.map((item) => <p key={item} className="flex gap-2 text-sm font-semibold leading-6 text-ink/60"><BadgeCheck className="mt-1 shrink-0 text-gold" size={14} />{item}</p>)}</div></div>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-ink/12 bg-ivory p-4"><div className="flex items-end justify-between gap-3"><p className="text-sm font-black text-ink/70">{label}</p><p className="text-3xl font-black text-ink">{Math.round(value)}%</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/12"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-ink/20 bg-ivory p-6 text-sm font-bold text-ink/60">{text}</div>;
}

function MetricGrid({ data, money = false }: { data: Record<string, unknown>; money?: boolean }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(data).filter(([, value]) => value !== null && value !== undefined && typeof value !== "object").slice(0, 18).map(([key, value]) => <Fact key={key} label={key.replace(/_/g, " ")} value={typeof value === "number" && money ? formatInr(value) : String(value)} />)}</div>;
}

function RouteCard({ label, focus }: { label: string; focus: string }) {
  return <div className="rounded-xl border border-ink/12 bg-ivory p-4"><p className="text-sm font-black text-ink">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-ink/60">{focus}</p></div>;
}

function SimilarCard({ item }: { item: PropertyIntelligenceDetail["similar_properties"][number] }) {
  return <Link href={`/properties/${item.id}`} className="rounded-xl border border-ink/12 bg-ivory p-4 transition hover:-translate-y-1 hover:bg-white"><p className="text-xs font-black uppercase tracking-[0.18em] text-gold">{item.locality}</p><h4 className="mt-1 text-xl font-black text-ink">{item.title}</h4><p className="mt-2 text-sm font-semibold text-ink/60">{formatCr(item.asking_price)} - {item.bedrooms || "-"} BHK - {item.carpet_area_sqft || "-"} sq ft</p><div className="mt-4 flex flex-wrap gap-2"><ActionButton label="Compare" /><ActionButton label="Shortlist" /><ActionButton label="Schedule Visit" /></div></Link>;
}

function PropertyPointMap({ lat, lng, title, locality }: { lat: number; lng: number; title: string; locality: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !containerRef.current) return;
      mapRef.current = L.map(containerRef.current, { zoomControl: false }).setView([lat, lng], 14);
      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(mapRef.current);
      L.marker([lat, lng], { icon: L.divIcon({ className: "astra-marker", html: `<div class="astra-marker-dot active">${locality}</div>`, iconSize: [92, 34], iconAnchor: [46, 34] }) }).bindPopup(`<strong>${title}</strong><br/>${locality}, Mumbai`).addTo(mapRef.current);
    }
    init();
    return () => { mounted = false; };
  }, [lat, lng, title, locality]);

  return <div ref={containerRef} className="h-[420px] overflow-hidden rounded-xl border border-ink/12 bg-sand" />;
}
