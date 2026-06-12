"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
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

  return (
    <article className="group overflow-hidden rounded-[3px] border border-ink/12 bg-ivory shadow-lx transition hover:-translate-y-1 hover:border-gold">
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
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/82 via-espresso/12 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-ivory/30 bg-espresso/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory backdrop-blur">
            {property.status}
          </span>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-ivory">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-goldsoft">{property.locality}</p>
              <p className="lx-display mt-1 text-2xl font-light leading-none">{formatCr(property.price)}</p>
            </div>
            <p className="text-xs font-semibold text-ivory/75">{property.bedrooms} BHK · {property.area_sqft} sq ft</p>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <Link href={detailHref} className="block">
          <h3 className="lx-display text-xl font-light leading-snug text-ink transition-colors group-hover:text-gold">
            {property.title}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-ink/55">
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
            className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-[3px] bg-ink px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#2b251f]"
          >
            View details
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </Link>
          <button
            onClick={() => onFocus(property)}
            className="rounded-[3px] border border-ink/15 bg-ivory px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-sand"
          >
            Map
          </button>
          <button
            onClick={() => onCompare(property)}
            className={clsx(
              "rounded-[3px] border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
              selected
                ? "border-gold bg-gold text-ivory"
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
