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
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Natural-language command center</p>
      <h2 className="mb-3 text-2xl font-black text-slate-950">Ask the Mumbai agent swarm</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-28 w-full rounded-md border border-slate-200 bg-white p-4 text-sm outline-none ring-0 focus:border-emerald-500"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
      >
        <SendHorizontal size={16} />
        {loading ? "Routing..." : "Run agent"}
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="rounded-md bg-white px-3 py-1.5 text-left text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {ex}
          </button>
        ))}
      </div>
      {answer && <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{answer}</div>}
    </section>
  );
}
