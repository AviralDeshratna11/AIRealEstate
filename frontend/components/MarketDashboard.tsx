"use client";

import { useEffect, useState } from "react";
import { MarketInsights, getMarketInsights } from "@/lib/api";

export function MarketDashboard() {
  const [insights, setInsights] = useState<MarketInsights | null>(null);

  useEffect(() => {
    getMarketInsights().then(setInsights).catch(console.error);
  }, []);

  if (!insights) return <div className="glass rounded-lg p-5 shadow-soft">Loading Mumbai market intelligence...</div>;

  return (
    <section className="glass rounded-lg p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Market intelligence</p>
          <h2 className="text-2xl font-black text-slate-950">Mumbai redevelopment and inventory engine</h2>
        </div>
        <div className="rounded-md bg-emerald-600 px-4 py-2 text-center text-white">
          <p className="text-xl font-black">{insights.redevelopment.development_agreements_signed_total}</p>
          <p className="text-[10px] font-bold uppercase">DAs signed</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {insights.inventory_by_price_bucket.map((row) => (
          <div key={row.cost_range} className="rounded-md bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase text-slate-400">{row.cost_range}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{row.months_inventory} mo</p>
            <p className="text-xs text-slate-500">{row.unsold_units.toLocaleString("en-IN")} unsold - {row.annual_sales_units.toLocaleString("en-IN")} sales</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {Object.entries(insights.redevelopment.top_micro_markets).map(([market, count]) => (
          <div key={market} className="rounded-md bg-slate-950 p-3 text-white">
            <p className="text-xs text-slate-300">{market}</p>
            <p className="text-xl font-black">{count}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
