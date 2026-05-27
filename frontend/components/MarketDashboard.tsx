"use client";

import { useEffect, useState } from "react";
import { MarketInsights, getMarketInsights } from "@/lib/api";

export function MarketDashboard() {
  const [insights, setInsights] = useState<MarketInsights | null>(null);

  useEffect(() => {
    getMarketInsights().then(setInsights).catch(console.error);
  }, []);

  if (!insights) return <div className="glass rounded-lg p-5 shadow-soft font-black text-ink">Loading Mumbai market intelligence...</div>;

  return (
    <section className="glass rounded-lg p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Market intelligence</p>
          <h2 className="font-display text-3xl font-black leading-none text-ink">Mumbai redevelopment and inventory engine</h2>
        </div>
        <div className="rounded-md bg-coral px-4 py-2 text-center text-white shadow-crisp">
          <p className="font-display text-2xl font-black">{insights.redevelopment.development_agreements_signed_total}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em]">DAs signed</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {insights.inventory_by_price_bucket.map((row) => (
          <div key={row.cost_range} className="rounded-md border border-ink/12 bg-white/62 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/42">{row.cost_range}</p>
            <p className="mt-1 font-display text-3xl font-black text-ink">{row.months_inventory} mo</p>
            <p className="text-xs font-semibold text-ink/52">{row.unsold_units.toLocaleString("en-IN")} unsold - {row.annual_sales_units.toLocaleString("en-IN")} sales</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {Object.entries(insights.redevelopment.top_micro_markets).map(([market, count]) => (
          <div key={market} className="ink-panel rounded-md p-3">
            <p className="text-xs font-bold text-white/58">{market}</p>
            <p className="font-display text-2xl font-black">{count}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
