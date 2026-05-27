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
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Agent swarm</p>
      <h2 className="mb-4 text-2xl font-black text-slate-950">Automation agents for Mumbai launch</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {agents.map(([name, desc]) => (
          <div key={name} className="rounded-md bg-white p-4 ring-1 ring-slate-200">
            <p className="font-black text-slate-950">{name}</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
