"use client";

import { useEffect, useRef } from "react";
import type { LatLngTuple, Map as LeafletMap, Marker } from "leaflet";
import clsx from "clsx";
import { MapPin } from "lucide-react";
import { Property, formatCr } from "@/lib/api";

export function PropertyMap({
  properties,
  focused,
  onFocus,
  compact,
  heightClassName,
}: {
  properties: Property[];
  focused?: Property | null;
  onFocus: (property: Property) => void;
  /** Renders without the header/footer chrome, for embedding beside a scrollable list. */
  compact?: boolean;
  /** Overrides the default h-[620px] map viewport height. */
  heightClassName?: string;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !containerRef.current) return;
      leafletRef.current = L;
      mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView([19.076, 72.8777], 11);
      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const bounds: LatLngTuple[] = [];

    properties.forEach((p) => {
      const active = focused?.id === p.id;
      const marker = L.marker([p.latitude, p.longitude], {
        icon: L.divIcon({
          className: "astra-marker",
          html: `<div class="${active ? "astra-marker-dot active" : "astra-marker-dot"}"><span>${formatCr(p.price)}</span></div>`,
          iconSize: [92, 34],
          iconAnchor: [46, 34],
        }),
      });
      marker.on("click", () => onFocus(p));
      marker.bindPopup(`<strong>${p.title}</strong><br/>${p.locality}, Mumbai<br/>${formatCr(p.price)} - ${p.bedrooms}BHK`);
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.push([p.latitude, p.longitude]);
    });

    if (bounds.length > 1 && !focused) map.fitBounds(bounds, { padding: [32, 32] });
    if (focused) map.flyTo([focused.latitude, focused.longitude], 14, { duration: 0.8 });
  }, [properties, focused, onFocus]);

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-ink/12 bg-ivory shadow-lx">
        <div ref={containerRef} className={clsx(heightClassName || "h-[620px]", "w-full bg-sand")} />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/90 px-3 py-1.5 text-[11px] font-semibold text-ivory backdrop-blur">
          {properties.length} on map
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-10 bg-gold" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Mumbai live map</p>
          </div>
          <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">Locality pins</h2>
        </div>
        <div className="rounded-xl bg-ink px-3 py-1 text-xs font-semibold text-ivory">OSM - {properties.length}</div>
      </div>
      <div ref={containerRef} className={clsx(heightClassName || "h-[620px]", "overflow-hidden rounded-xl border border-ink/15 bg-sand")} />
      <div className="mt-4 rounded-xl bg-espresso text-ivory p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-goldsoft">
          <MapPin size={14} />
          Focused property
        </p>
        <p className="mt-1 font-semibold">{focused?.title || "Select a marker to focus"}</p>
        <p className="text-sm text-ivory/65">
          {focused ? `${focused.address} - EMI est. ${formatCr((focused.monthly_emi_estimate || 0) * 12)}/yr` : "Map uses real Mumbai coordinates and OpenStreetMap tiles."}
        </p>
      </div>
    </section>
  );
}
