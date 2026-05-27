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
    <section className="glass rounded-lg p-5 shadow-soft">
      <p className="section-kicker">Tour guide assistant</p>
      <h2 className="font-display text-3xl font-black leading-none text-ink">AI viewing route</h2>
      <button onClick={run} className="mt-4 flex items-center gap-2 rounded-md bg-peacock px-4 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5">
        <Route size={16} />
        Generate guided tour
      </button>
      {tour && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium leading-6 text-ink/62">{tour.narration}</p>
          {tour.waypoints.map((w, i) => (
            <div key={w.label} className="rounded-md border border-ink/12 bg-white/62 p-3">
              <p className="font-black text-ink">{i + 1}. {w.label}</p>
              <p className="text-sm font-semibold text-ink/52">{w.focus}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
