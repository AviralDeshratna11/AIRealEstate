"use client";

import { useState } from "react";
import { Route } from "lucide-react";
import { Property, TourGuideResult, guideTour } from "@/lib/api";

export function TourGuidePanel({ focused }: { focused: Property | null }) {
  const [tour, setTour] = useState<TourGuideResult | null>(null);

  async function run() {
    setTour(await guideTour(focused?.id));
  }

  return (
    <section className="rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx">
      <div className="flex items-center gap-2">
        <span className="h-px w-10 bg-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Tour guide assistant</p>
      </div>
      <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">AI viewing route</h2>
      <button onClick={run} className="mt-4 flex items-center gap-2 rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition hover:bg-[#1d4ed8]">
        <Route size={16} />
        Generate guided tour
      </button>
      {tour && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium leading-6 text-ink/65">{tour.narration}</p>
          {tour.waypoints.map((w, i) => (
            <div key={w.label} className="rounded-xl border border-ink/12 bg-ivory p-3">
              <p className="font-semibold text-ink">{i + 1}. {w.label}</p>
              <p className="text-sm font-semibold text-ink/55">{w.focus}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
