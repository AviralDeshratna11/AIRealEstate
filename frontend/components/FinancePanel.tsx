"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { FinanceEstimate, Property, estimateFinance, formatInr } from "@/lib/api";

export function FinancePanel({ focused }: { focused: Property | null }) {
  const [result, setResult] = useState<FinanceEstimate | null>(null);

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
    <section className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx">
      <div className="flex items-center gap-2">
        <span className="h-px w-10 bg-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Finance and construction</p>
      </div>
      <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">EMI and material estimate</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-ink/65">
        Estimates loan burden and construction materials from the selected property price and built-up area.
      </p>
      <button
        onClick={run}
        disabled={!focused}
        className="mt-4 flex items-center gap-2 rounded-[3px] bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#8f6d32] disabled:opacity-50"
      >
        <Calculator size={16} />
        Estimate focused property
      </button>
      {result && (
        <div className="mt-4 grid gap-3 rounded-[3px] border border-ink/12 bg-ivory p-4 md:grid-cols-2">
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">{label}</p>
      <p className="lx-display mt-1 text-2xl font-light text-ink">{value}</p>
    </div>
  );
}
