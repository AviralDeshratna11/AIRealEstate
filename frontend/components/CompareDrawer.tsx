"use client";

import { X } from "lucide-react";
import { Property, formatCr, formatInr } from "@/lib/api";

export function CompareDrawer({ items, onClear }: { items: Property[]; onClear: () => void }) {
  if (!items.length) return null;

  return (
    <div className="ink-panel fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-6xl rounded-lg border border-white/12 p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-xl font-black">Compare shortlisted properties</p>
        <button onClick={onClear} className="grid h-8 w-8 place-items-center rounded-md bg-white/10 text-white/68 hover:bg-white/15">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-md border border-white/12 bg-white/10 p-4">
            <p className="font-black">{p.title}</p>
            <p className="text-sm text-white/68">{p.locality} - {formatCr(p.price)}</p>
            <p className="mt-2 text-xs text-white/58">
              EMI {formatInr(p.monthly_emi_estimate)} - Inventory {p.inventory_months} mo - ReDev {Math.round(p.redevelopment_score || 0)}/100
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
