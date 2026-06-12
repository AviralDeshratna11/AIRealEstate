"use client";

import { useEffect, useState } from "react";
import { MarketInsights, getMarketInsights } from "@/lib/api";

export function MarketDashboard() {
  const [insights, setInsights] = useState<MarketInsights | null>(null);

  useEffect(() => {
    getMarketInsights().then(setInsights).catch(console.error);
  }, []);

  if (!insights) return <div className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx font-light text-ink">Loading Mumbai market intelligence...</div>;

  return (
    <section className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-10 bg-gold" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Market intelligence</p>
          </div>
          <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">Mumbai redevelopment and inventory engine</h2>
        </div>
        <div className="rounded-[3px] bg-gold px-4 py-2 text-center text-ivory shadow-lx">
          <p className="lx-display text-2xl font-light">{insights.redevelopment.development_agreements_signed_total}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">DAs signed</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {insights.inventory_by_price_bucket.map((row) => (
          <div key={row.cost_range} className="rounded-[3px] border border-ink/12 bg-ivory p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">{row.cost_range}</p>
            <p className="lx-display mt-1 text-3xl font-light text-ink">{row.months_inventory} mo</p>
            <p className="text-xs font-semibold text-ink/55">{row.unsold_units.toLocaleString("en-IN")} unsold - {row.annual_sales_units.toLocaleString("en-IN")} sales</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {Object.entries(insights.redevelopment.top_micro_markets).map(([market, count]) => (
          <div key={market} className="rounded-[3px] bg-espresso text-ivory p-3">
            <p className="text-xs font-semibold text-ivory/55">{market}</p>
            <p className="lx-display text-2xl font-light">{count}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
