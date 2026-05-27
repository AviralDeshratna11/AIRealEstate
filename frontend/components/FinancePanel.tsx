"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Property, estimateFinance, formatInr } from "@/lib/api";

export function FinancePanel({ focused }: { focused: Property | null }) {
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!focused) return;
    setResult(await estimateFinance({
      property_id: focused.id,
      down_payment_pct: 20,
      annual_rate_pct: 8,
      tenure_years: 20,
      construction_quality: "good",
    }));
  }

  return (
    <section className="glass rounded-lg p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Finance and construction</p>
      <h2 className="text-2xl font-black text-slate-950">EMI and material estimate</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Estimates loan burden and construction materials from the selected property's price and built-up area.
      </p>
      <button
        onClick={run}
        disabled={!focused}
        className="mt-4 flex items-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        <Calculator size={16} />
        Estimate focused property
      </button>
      {result && (
        <div className="mt-4 grid gap-3 rounded-md bg-white p-4 ring-1 ring-slate-200 md:grid-cols-2">
          <Kpi label="Monthly EMI" value={formatInr(result.monthly_emi)} />
          <Kpi label="EMI/lakh" value={formatInr(result.emi_per_lakh)} />
          <Kpi label="Construction range" value={`${formatInr(result.construction_cost_range?.min)} - ${formatInr(result.construction_cost_range?.max)}`} />
          <Kpi label="Cement bags" value={result.material_estimate?.cement_bags?.join(" - ") || "-"} />
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
