"use client";

import { useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, Heart, MapPin, Ruler } from "lucide-react";
import { Property, formatCr } from "@/lib/api";

// Listing card: deliberately lean. It carries only what a buyer needs to
// triage a shortlist — price, configuration, locality and one headline signal.
// The full picture (description, finance, redevelopment KPIs, tags, XR) lives
// on the property detail page so the grid stays calm and scannable.
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
  const [saved, setSaved] = useState(false);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-ink/12 bg-ivory shadow-lx transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={detailHref} className="block w-full text-left">
        <div className="relative h-52 overflow-hidden bg-espresso">
          {property.image_url && (
            <Image
              src={property.image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/45 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-ivory/30 bg-espresso/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory backdrop-blur">
            {property.status}
          </span>
        </div>
      </Link>
      <button
        onClick={() => setSaved((value) => !value)}
        aria-label={saved ? "Remove from saved" : "Save listing"}
        className={clsx(
          "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition-colors",
          saved ? "border-gold bg-gold text-ivory" : "border-ivory/40 bg-espresso/45 text-ivory hover:bg-espresso/65"
        )}
      >
        <Heart size={16} className={clsx(saved && "fill-current")} />
      </button>

      <div className="space-y-4 p-5">
        <Link href={detailHref} className="block">
          <p className="text-2xl font-bold leading-none text-ink">{formatCr(property.price)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-ink/70">
            <span className="flex items-center gap-1.5">
              <BedDouble size={15} /> {property.bedrooms} bed
            </span>
            <span className="flex items-center gap-1.5">
              <Bath size={15} /> {property.bathrooms} bath
            </span>
            <span className="flex items-center gap-1.5">
              <Ruler size={15} /> {property.area_sqft} sqft
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold leading-snug text-ink transition-colors group-hover:text-gold">
            {property.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink/55">
            <MapPin size={13} /> {property.locality}, Mumbai
          </p>
        </Link>

        {Boolean(property.redevelopment_score) && (
          <p className="border-t border-ink/10 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">
            Redevelopment signal
            <span className="ml-2 text-gold">{Math.round(property.redevelopment_score || 0)} / 100</span>
          </p>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={detailHref}
            className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#1d4ed8]"
          >
            View details
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </Link>
          <button
            onClick={() => onFocus(property)}
            className="rounded-xl border border-ink/15 bg-ivory px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-sand"
          >
            Map
          </button>
          <button
            onClick={() => onCompare(property)}
            className={clsx(
              "rounded-xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
              selected
                ? "border-ink bg-ink text-ivory"
                : "border-ink/15 bg-ivory text-ink hover:bg-sand"
            )}
          >
            {selected ? "Added" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}
