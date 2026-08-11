"use client";

import { X } from "lucide-react";
import { Property, formatCr, formatInr } from "@/lib/api";

export function CompareDrawer({ items, onClear }: { items: Property[]; onClear: () => void }) {
  if (!items.length) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-6xl rounded-xl border border-ivory/12 bg-espresso p-4 text-ivory shadow-lx">
      <div className="mb-3 flex items-center justify-between">
        <p className="lx-display text-xl font-light">Compare shortlisted properties</p>
        <button onClick={onClear} className="grid h-8 w-8 place-items-center rounded-xl bg-ivory/10 text-ivory/70 hover:bg-ivory/15">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border border-ivory/12 bg-ivory/10 p-4">
            <p className="font-semibold">{p.title}</p>
            <p className="text-sm text-ivory/70">{p.locality} - {formatCr(p.price)}</p>
            <p className="mt-2 text-xs text-ivory/55">
              EMI {formatInr(p.monthly_emi_estimate)} - Inventory {p.inventory_months} mo - ReDev {Math.round(p.redevelopment_score || 0)}/100
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
