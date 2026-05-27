"use client";

import { useState } from "react";
import { FileUp, Scale } from "lucide-react";
import { API_URL } from "@/lib/api";

export function DocumentAndNegotiation() {
  const [docResult, setDocResult] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<any>(null);

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
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Document agent</p>
        <h2 className="text-2xl font-black text-slate-950">Extract contingencies</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Upload an inspection report, purchase agreement, PDF, image, or text file.</p>
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-black text-slate-600 hover:border-estate-500 hover:bg-estate-50">
          <FileUp size={18} />
          Upload document
          <input type="file" accept=".pdf,image/*,.txt" onChange={(e) => upload(e.target.files?.[0])} className="sr-only" />
        </label>
        {docResult && <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-emerald-200">{JSON.stringify(docResult, null, 2)}</pre>}
      </div>

      <div className="glass rounded-lg p-5 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">ASTRA negotiation</p>
        <h2 className="text-2xl font-black text-slate-950">Optimize counter-offer</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Runs a buyer counter-offer scenario while keeping the walk-away budget internal to the solver.</p>
        <button onClick={optimize} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-estate-700 px-5 py-3 font-bold text-white hover:bg-estate-900">
          <Scale size={17} />
          Run buyer counter-offer demo
        </button>
        {negotiation && <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-emerald-200">{JSON.stringify(negotiation, null, 2)}</pre>}
      </div>
    </section>
  );
}
