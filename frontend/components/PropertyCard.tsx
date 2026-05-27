"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Building2, CalendarDays, IndianRupee, MapPin, TrendingUp } from "lucide-react";
import { Property, formatCr, formatInr } from "@/lib/api";

export function PropertyCard({
  property,
  selected,
  onCompare,
  onFocus,
}: {
  property: Property;
  selected: boolean;
  onCompare: (property: Property) => void;
  onFocus: (property: Property) => void;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-estate-500 hover:shadow-soft">
      <button onClick={() => onFocus(property)} className="block w-full text-left">
        <div className="relative h-48 overflow-hidden bg-slate-200">
          {property.image_url && <img src={property.image_url} alt="" className="h-full w-full object-cover" />}
          <div className="absolute left-3 top-3 rounded-md bg-white/95 px-3 py-1 text-xs font-black uppercase text-slate-900">{property.status}</div>
          <div className="absolute bottom-3 left-3 rounded-md bg-slate-950/90 px-3 py-2 text-white backdrop-blur">
            <p className="text-lg font-black">{formatCr(property.price)}</p>
            <p className="text-xs text-slate-200">{property.bedrooms}BHK - {property.area_sqft} sq ft</p>
          </div>
        </div>
      </button>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-xl font-black leading-tight text-slate-950">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {property.locality}, Mumbai</p>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{property.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Kpi icon={<TrendingUp size={14} />} label="Redevelopment" value={`${Math.round(property.redevelopment_score || 0)}/100`} />
          <Kpi icon={<Building2 size={14} />} label="Inventory" value={`${property.inventory_months || "-"} mo`} />
          <Kpi icon={<IndianRupee size={14} />} label="EMI est." value={formatInr(property.monthly_emi_estimate)} />
          <Kpi icon={<CalendarDays size={14} />} label="Yield" value={`${property.expected_rent_yield || "-"}%`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {property.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onFocus(property)} className="flex-1 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white">View on map</button>
          <button
            onClick={() => onCompare(property)}
            className={clsx(
              "rounded-md px-4 py-3 text-sm font-black ring-1",
              selected ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-900 ring-slate-200"
            )}
          >
            {selected ? "Added" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 text-slate-700">
      <div className="mb-1 flex items-center gap-1 text-slate-400">{icon}<span>{label}</span></div>
      <p className="font-black text-slate-950">{value}</p>
    </div>
  );
}
