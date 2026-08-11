"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Property, runAgent, searchProperties } from "@/lib/api";

const examples = [
  "2BHK in Mumbai below 2.5 cr with metro access and low inventory",
  "Find redevelopment upside in Borivali, Andheri, Bandra or Ghatkopar",
  "WhatsApp this lead: 3BHK Powai under 4 cr, wants visit tomorrow",
  "Estimate EMI and construction material for a 1200 sq ft high quality home",
];

export function AgentConsole({ onProperties }: { onProperties: (items: Property[]) => void }) {
  const [query, setQuery] = useState(examples[0]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const lower = query.toLowerCase();
      const agent = await runAgent(query, lower.includes("whatsapp") ? "whatsapp" : "web");
      setAnswer(`${agent.route}: ${agent.answer}`);
      const props = agent.data?.properties;
      if (props?.length) onProperties(props);
      else if (agent.route?.includes("search")) {
        const search = await searchProperties(query);
        onProperties(search.properties);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx">
      <div className="flex items-center gap-2">
        <span className="h-px w-10 bg-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Natural-language command center</p>
      </div>
      <h2 className="lx-display mb-3 mt-1 text-3xl font-light leading-none text-ink">Ask the Mumbai agent swarm</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-32 w-full rounded-xl border border-ink/15 bg-ivory p-4 text-sm font-medium text-ink outline-none ring-0 placeholder:text-ink/35 focus:border-gold"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#1d4ed8] disabled:opacity-60"
      >
        <SendHorizontal size={16} />
        {loading ? "Routing..." : "Run agent"}
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="rounded-xl border border-ink/12 bg-ivory px-3 py-1.5 text-left text-xs font-bold text-ink/55 hover:border-gold hover:bg-sand hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>
      {answer && <div className="mt-4 rounded-xl border border-gold/20 bg-sand p-4 text-sm font-semibold leading-6 text-gold">{answer}</div>}
    </section>
  );
}
