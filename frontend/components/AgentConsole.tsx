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
    <section className="glass rounded-lg p-5 shadow-soft">
      <p className="section-kicker">Natural-language command center</p>
      <h2 className="mb-3 font-display text-3xl font-black leading-none text-ink">Ask the Mumbai agent swarm</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-32 w-full rounded-md border border-ink/15 bg-[#fffaf0] p-4 text-sm font-medium text-ink outline-none ring-0 placeholder:text-ink/35 focus:border-coral"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-coral px-4 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <SendHorizontal size={16} />
        {loading ? "Routing..." : "Run agent"}
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="rounded-md border border-ink/12 bg-white/62 px-3 py-1.5 text-left text-xs font-bold text-ink/58 hover:border-peacock hover:bg-white hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>
      {answer && <div className="mt-4 rounded-md border border-peacock/20 bg-[#eef8f6] p-4 text-sm font-semibold leading-6 text-peacock">{answer}</div>}
    </section>
  );
}
