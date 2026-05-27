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
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Tour guide assistant</p>
      <h2 className="text-2xl font-black text-slate-950">AI viewing route</h2>
      <button onClick={run} className="mt-4 flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-black text-white">
        <Route size={16} />
        Generate guided tour
      </button>
      {tour && (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-slate-600">{tour.narration}</p>
          {tour.waypoints.map((w, i) => (
            <div key={w.label} className="rounded-md bg-white p-3 ring-1 ring-slate-200">
              <p className="font-black">{i + 1}. {w.label}</p>
              <p className="text-sm text-slate-500">{w.focus}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
