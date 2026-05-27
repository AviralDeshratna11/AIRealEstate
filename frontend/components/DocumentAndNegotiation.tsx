"use client";

import { useState } from "react";
import { FileUp, Scale } from "lucide-react";
import { API_URL } from "@/lib/api";

export function DocumentAndNegotiation() {
  const [docResult, setDocResult] = useState<unknown>(null);
  const [negotiation, setNegotiation] = useState<unknown>(null);

  async function upload(file?: File) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/documents/extract`, { method: "POST", body: form });
    setDocResult(await res.json());
  }

  async function optimize() {
    const res = await fetch(`${API_URL}/api/negotiation/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "buyer",
        target_price: 16500000,
        walk_away_price: 18500000,
        opponent_offer: 19500000,
        urgency: 0.35,
        concession_value: 200000,
      }),
    });
    setNegotiation(await res.json());
  }

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker">Document agent</p>
        <h2 className="font-display text-3xl font-black leading-none text-ink">Extract contingencies</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">Upload an inspection report, purchase agreement, PDF, image, or text file.</p>
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-ink/28 bg-white/58 px-4 py-8 text-sm font-black text-ink/62 hover:border-coral hover:bg-white">
          <FileUp size={18} />
          Upload document
          <input type="file" accept=".pdf,image/*,.txt" onChange={(e) => upload(e.target.files?.[0])} className="sr-only" />
        </label>
        {docResult !== null && <pre className="ink-panel mt-4 max-h-80 overflow-auto rounded-md p-3 text-xs text-[#f3d59b]">{JSON.stringify(docResult, null, 2)}</pre>}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="section-kicker">ASTRA negotiation</p>
        <h2 className="font-display text-3xl font-black leading-none text-ink">Optimize counter-offer</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/60">Runs a buyer counter-offer scenario while keeping the walk-away budget internal to the solver.</p>
        <button onClick={optimize} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 font-black text-white shadow-crisp transition hover:-translate-y-0.5">
          <Scale size={17} />
          Run buyer counter-offer demo
        </button>
        {negotiation !== null && <pre className="ink-panel mt-4 max-h-80 overflow-auto rounded-md p-3 text-xs text-[#f3d59b]">{JSON.stringify(negotiation, null, 2)}</pre>}
      </div>
    </section>
  );
}
