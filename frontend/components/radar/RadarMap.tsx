"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { ArrowUpRight, Layers } from "lucide-react";
import { SIGNAL_META, scoreTone, type MapLocalityFeature, type RadarMapResponse } from "@/lib/radar";
import { SignalBadge } from "./primitives";

const LAYER_DEFAULTS: Record<string, boolean> = {
  localities: true,
  projects: true,
  zones: true,
  demand: false,
  risk: false,
};

export function RadarMap({ data, height = 620 }: { data: RadarMapResponse; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const groupsRef = useRef<Record<string, LayerGroup>>({});

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = { ...LAYER_DEFAULTS };
    data.layers.forEach((l) => { if (!(l.key in init)) init[l.key] = false; });
    return init;
  });
  const [selected, setSelected] = useState<MapLocalityFeature | null>(null);

  const localityCoords = useMemo(() => {
    const m = new Map<string, MapLocalityFeature>();
    data.localities.forEach((l) => m.set(l.slug, l));
    return m;
  }, [data.localities]);

  // Init map once.
  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView(data.center, data.zoom);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
      mapRef.current = map;
      // force a redraw of layers after init
      setEnabled((e) => ({ ...e }));
    }
    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render / re-render layers when toggles or data change.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    Object.values(groupsRef.current).forEach((g) => g.remove());
    groupsRef.current = {};

    const ensure = (key: string) => {
      if (!groupsRef.current[key]) groupsRef.current[key] = L.layerGroup().addTo(map);
      return groupsRef.current[key];
    };

    // Heatmap-style translucent circles (demand = gold, risk = red).
    if (enabled.demand) {
      const g = ensure("demand");
      data.localities.forEach((l) => {
        L.circle([l.latitude, l.longitude], { radius: 300 + l.future_score * 22, color: "#a8813c", weight: 0, fillColor: "#a8813c", fillOpacity: 0.1 }).addTo(g);
      });
    }
    if (enabled.risk) {
      const g = ensure("risk");
      data.localities.forEach((l) => {
        const intensity = Math.max(0, 100 - l.future_score);
        L.circle([l.latitude, l.longitude], { radius: 300 + intensity * 26, color: "#d6532c", weight: 0, fillColor: "#d6532c", fillOpacity: 0.09 }).addTo(g);
      });
    }

    // Redevelopment zones (purple diamonds at their locality).
    if (enabled.zones) {
      const g = ensure("zones");
      const zoneLayer = data.layers.find((l) => l.key === "zones");
      zoneLayer?.features.forEach((f) => {
        const loc = localityCoords.get(String(f.locality ?? ""));
        if (!loc) return;
        L.marker([loc.latitude + 0.004, loc.longitude + 0.004], {
          icon: L.divIcon({ className: "astra-marker", html: `<div class="radar-signal-dot" style="background:#7c3aed;border-radius:3px;transform:rotate(45deg);min-width:18px;height:18px"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }),
        }).bindPopup(`<strong>${String(f.name ?? "Redevelopment zone")}</strong><br/>${String(f.type ?? "").replace(/_/g, " ")}`).addTo(g);
      });
    }

    // Infrastructure projects (blue squares near affected localities).
    if (enabled.projects) {
      const g = ensure("projects");
      const projectLayer = data.layers.find((l) => l.key === "projects");
      projectLayer?.features.forEach((f) => {
        const slugs = (f.localities as string[] | undefined) ?? [];
        slugs.forEach((slug) => {
          const loc = localityCoords.get(slug);
          if (!loc) return;
          L.marker([loc.latitude - 0.004, loc.longitude - 0.004], {
            icon: L.divIcon({ className: "astra-marker", html: `<div style="width:14px;height:14px;background:#2563eb;border:2px solid #f9fafb;box-shadow:2px 2px 0 rgba(17,24,39,.25)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }),
          }).bindPopup(`<strong>${String(f.name ?? "Project")}</strong><br/>${String(f.type ?? "")} · ${String(f.status ?? "")}`).addTo(g);
        });
      });
    }

    // Localities (primary): circle markers sized by Future Score, coloured by signal.
    if (enabled.localities) {
      const g = ensure("localities");
      data.localities.forEach((l) => {
        const meta = SIGNAL_META[l.signal];
        const marker = L.circleMarker([l.latitude, l.longitude], {
          radius: 9 + (l.future_score / 100) * 14,
          color: "#f9fafb",
          weight: 2,
          fillColor: meta.color,
          fillOpacity: 0.85,
        });
        marker.on("click", () => { setSelected(l); map.flyTo([l.latitude, l.longitude], 13, { duration: 0.7 }); });
        marker.bindTooltip(`${l.name} · ${Math.round(l.future_score)}`, { direction: "top" });
        marker.addTo(g);
      });
    }
  }, [enabled, data, localityCoords]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="radar-card overflow-hidden p-0">
        <div ref={containerRef} className="radar-leaflet w-full" style={{ height }} />
      </div>

      <div className="space-y-4">
        <div className="radar-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Layers size={15} className="text-gold" />
            <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink/70">Map layers</h3>
          </div>
          <div className="space-y-1.5">
            {data.layers.map((l) => (
              <label key={l.key} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-ink/5">
                <span className="flex items-center gap-2 text-[13px] text-ink/80">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
                <input
                  type="checkbox"
                  checked={!!enabled[l.key]}
                  onChange={(e) => setEnabled((prev) => ({ ...prev, [l.key]: e.target.checked }))}
                  className="h-4 w-4 accent-[#111827]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="radar-card p-4">
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-ink/70">Signal legend</h3>
          <div className="grid grid-cols-1 gap-1.5">
            {(Object.keys(SIGNAL_META) as Array<keyof typeof SIGNAL_META>).map((k) => (
              <span key={k} className="flex items-center gap-2 text-[12px] text-ink/70">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SIGNAL_META[k].color }} />
                {SIGNAL_META[k].label}
              </span>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="radar-glass p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">{selected.zone}</p>
            <div className="flex items-center justify-between gap-2">
              <h3 className="lx-display text-2xl font-light text-ink">{selected.name}</h3>
              <span className="lx-display text-3xl font-light" style={{ color: scoreTone(selected.future_score) }}>{Math.round(selected.future_score)}</span>
            </div>
            <div className="mt-1"><SignalBadge signal={selected.signal} small /></div>
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">Top catalysts</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] text-ink/70">
                {selected.top_catalysts.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-700">Top risks</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] text-ink/70">
                {selected.top_risks.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
            <Link
              href={`/radar/localities/${selected.slug}`}
              className="mt-3 inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-1.5 text-[12px] font-semibold text-ivory hover:bg-ink/85"
            >
              Open locality <ArrowUpRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="radar-card p-4 text-[13px] italic text-ink/45">Click a locality marker to inspect its Future Score, catalysts and risks.</div>
        )}
      </div>
    </div>
  );
}
