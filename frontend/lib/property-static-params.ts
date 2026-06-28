import { DEMO_PROPERTIES } from "@/lib/demo";
import { MANAGER_DEMO_LISTING_IDS } from "@/lib/manager-demo";

const BACKEND_SAMPLE_IDS = [
  "lnt-elixir-reserve-barbet",
  "mumbai-powai-1",
  "mumbai-bandra-1",
  "mumbai-borivali-1",
  "mumbai-andheri-1",
  "mumbai-worli-1",
  "mumbai-ghatkopar-1",
  "mumbai-malad-1",
  "mumbai-chembur-1",
];

export function propertyDetailStaticParams() {
  const ids = new Set<string>();
  DEMO_PROPERTIES.forEach((property) => {
    ids.add(property.id);
    ids.add(`seller-${property.id}`);
  });
  MANAGER_DEMO_LISTING_IDS.forEach((id) => ids.add(id));
  BACKEND_SAMPLE_IDS.forEach((id) => {
    ids.add(id);
    ids.add(`seller-${id}`);
  });
  return Array.from(ids).map((id) => ({ id }));
}
