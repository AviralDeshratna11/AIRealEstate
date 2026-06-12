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
      <div className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx">
        <div className="flex items-center gap-2">
          <span className="h-px w-10 bg-gold" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Document agent</p>
        </div>
        <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">Extract contingencies</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/65">Upload an inspection report, purchase agreement, PDF, image, or text file.</p>
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-dashed border-ink/15 bg-ivory px-4 py-8 text-sm font-semibold text-ink/65 hover:border-gold hover:bg-sand">
          <FileUp size={18} />
          Upload document
          <input type="file" accept=".pdf,image/*,.txt" onChange={(e) => upload(e.target.files?.[0])} className="sr-only" />
        </label>
        {docResult !== null && <pre className="mt-4 max-h-80 overflow-auto rounded-[3px] bg-espresso p-3 text-xs text-goldsoft">{JSON.stringify(docResult, null, 2)}</pre>}
      </div>

      <div className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx">
        <div className="flex items-center gap-2">
          <span className="h-px w-10 bg-gold" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">ASTRA negotiation</p>
        </div>
        <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">Optimize counter-offer</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-ink/65">Runs a buyer counter-offer scenario while keeping the walk-away budget internal to the solver.</p>
        <button onClick={optimize} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[3px] bg-gold px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#8f6d32]">
          <Scale size={17} />
          Run buyer counter-offer demo
        </button>
        {negotiation !== null && <pre className="mt-4 max-h-80 overflow-auto rounded-[3px] bg-espresso p-3 text-xs text-goldsoft">{JSON.stringify(negotiation, null, 2)}</pre>}
      </div>
    </section>
  );
}
