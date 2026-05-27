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
    <section className="glass rounded-lg p-5 shadow-soft">
      <p className="section-kicker">Agent swarm</p>
      <h2 className="mb-4 font-display text-3xl font-black leading-none text-ink">Automation agents for Mumbai launch</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {agents.map(([name, desc], index) => (
          <div key={name} className="mapline rounded-md border border-ink/12 bg-white/62 p-4 pl-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-coral">Agent {String(index + 1).padStart(2, "0")}</p>
            <p className="mt-1 font-black text-ink">{name}</p>
            <p className="mt-1 text-sm font-medium leading-5 text-ink/55">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
