export function AgentSwarmPanel() {
  const agents = [
    ["Search Agent", "NL2SQL, semantic ranking, and Mumbai locality filters"],
    ["WhatsApp Assistant", "Lead qualification and instant follow-up replies"],
    ["Call Agent", "Voice triage and viewing bookings"],
    ["Tour Guide", "Route narration and locality context"],
    ["Finance Agent", "EMI, loan burden, construction, and material estimates"],
    ["Market Agent", "Redevelopment, unsold inventory, and liquidity score"],
    ["Negotiation Agent", "LP-optimized counter-offers with protected walk-away"],
    ["Document Agent", "RERA, agreement, dates, parties, and contingencies"],
    ["Availability Agent", "Real-time slot and status stream"],
    ["Codex Ops Agent", "Listing ingestion and operational automation"],
  ];

  return (
    <section className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx">
      <div className="flex items-center gap-2">
        <span className="h-px w-10 bg-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Agent swarm</p>
      </div>
      <h2 className="lx-display mb-4 mt-1 text-3xl font-light leading-none text-ink">Automation agents for Mumbai launch</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {agents.map(([name, desc], index) => (
          <div key={name} className="mapline rounded-[3px] border border-ink/12 bg-ivory p-4 pl-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Agent {String(index + 1).padStart(2, "0")}</p>
            <p className="mt-1 font-semibold text-ink">{name}</p>
            <p className="mt-1 text-sm font-medium leading-5 text-ink/55">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
