"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { API_URL } from "@/lib/api";

type AvailabilityItem = {
  id?: string;
  title: string;
  availability: string;
};

export function AvailabilityTicker() {
  const [items, setItems] = useState<AvailabilityItem[]>([]);

  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/properties/availability/stream`);
    source.addEventListener("availability", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { properties?: AvailabilityItem[] };
      setItems(data.properties || []);
    });
    source.onerror = () => source.close();
    return () => source.close();
  }, []);

  return (
    <div className="glass rounded-lg p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={16} className="text-coral" />
        <p className="font-display text-lg font-black text-ink">Real-time availability</p>
      </div>
      <div className="space-y-2">
        {(items.length ? items : [{ title: "Connecting to availability stream...", availability: "SSE pending" }]).slice(0, 4).map((item, idx) => (
          <div key={item.id || idx} className="rounded-md border border-ink/10 bg-white/58 px-3 py-2 text-sm">
            <p className="font-black text-ink">{item.title}</p>
            <p className="text-xs font-semibold text-ink/50">{item.availability}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
