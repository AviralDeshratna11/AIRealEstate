"use client";

import { useEffect, useRef } from "react";
import type { LatLngTuple, Map as LeafletMap, Marker } from "leaflet";
import { MapPin } from "lucide-react";
import { Property, formatCr } from "@/lib/api";

export function PropertyMap({
  properties,
  focused,
  onFocus,
}: {
  properties: Property[];
  focused?: Property | null;
  onFocus: (property: Property) => void;
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

  return (
    <section className="glass overflow-hidden rounded-lg p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Mumbai live map</p>
          <h2 className="text-2xl font-black text-slate-950">Locality pins</h2>
        </div>
        <div className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">OSM - {properties.length}</div>
      </div>
      <div ref={containerRef} className="h-[620px] overflow-hidden rounded-md bg-slate-200" />
      <div className="mt-4 rounded-md bg-slate-950 p-4 text-white">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200">
          <MapPin size={14} />
          Focused property
        </p>
        <p className="mt-1 font-bold">{focused?.title || "Select a marker to focus"}</p>
        <p className="text-sm text-white/70">
          {focused ? `${focused.address} - EMI est. ${formatCr((focused.monthly_emi_estimate || 0) * 12)}/yr` : "Map uses real Mumbai coordinates and OpenStreetMap tiles."}
        </p>
      </div>
    </section>
  );
}
