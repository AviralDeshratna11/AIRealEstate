"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Building2, CalendarDays, IndianRupee, MapPin, TrendingUp } from "lucide-react";
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
  const detailHref = `/properties/${property.id}`;

  return (
    <article className="group overflow-hidden rounded-lg border border-ink/15 bg-[#fffaf0]/92 shadow-sm transition hover:-translate-y-1 hover:border-coral hover:shadow-crisp">
      <Link href={detailHref} className="block w-full text-left">
        <div className="relative h-52 overflow-hidden bg-ink">
          {property.image_url && (
            <Image
              src={property.image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,23,19,0.04),rgba(25,23,19,0.72))]" />
          <div className="absolute left-3 top-3 rounded-md bg-[#fffaf0]/95 px-3 py-1 text-xs font-black uppercase text-ink">{property.status}</div>
          <div className="absolute bottom-3 left-3 rounded-md border border-white/18 bg-ink/88 px-3 py-2 text-[#fffaf0] backdrop-blur">
            <p className="font-display text-xl font-black">{formatCr(property.price)}</p>
            <p className="text-xs font-semibold text-white/68">{property.bedrooms}BHK - {property.area_sqft} sq ft</p>
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <Link href={detailHref} className="block">
            <h3 className="font-display text-2xl font-black leading-none text-ink transition group-hover:text-coral">{property.title}</h3>
          </Link>
          <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-ink/52"><MapPin size={14} /> {property.locality}, Mumbai</p>
        </div>
        <p className="line-clamp-3 text-sm font-medium leading-6 text-ink/62">{property.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Kpi icon={<TrendingUp size={14} />} label="Redevelopment" value={`${Math.round(property.redevelopment_score || 0)}/100`} />
          <Kpi icon={<Building2 size={14} />} label="Inventory" value={`${property.inventory_months || "-"} mo`} />
          <Kpi icon={<IndianRupee size={14} />} label="EMI est." value={formatInr(property.monthly_emi_estimate)} />
          <Kpi icon={<CalendarDays size={14} />} label="Yield" value={`${property.expected_rent_yield || "-"}%`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {property.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md border border-ink/10 bg-white/58 px-3 py-1 text-xs font-black text-ink/62">
              {tag}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Link href={detailHref} className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-black text-[#fffaf0] transition hover:bg-coral">
            View details
            <ArrowRight size={15} />
          </Link>
          <button onClick={() => onFocus(property)} className="rounded-md border border-ink/15 bg-[#fffaf0] px-4 py-3 text-sm font-black text-ink transition hover:border-peacock hover:text-peacock">Map</button>
          <button
            onClick={() => onCompare(property)}
            className={clsx(
              "rounded-md px-4 py-3 text-sm font-black ring-1 transition",
              selected ? "bg-coral text-white ring-coral" : "bg-[#fffaf0] text-ink ring-ink/15 hover:ring-coral"
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
    <div className="rounded-md border border-ink/10 bg-white/54 p-3 text-ink">
      <div className="mb-1 flex items-center gap-1 text-ink/38">{icon}<span>{label}</span></div>
      <p className="font-black text-ink">{value}</p>
    </div>
  );
}
