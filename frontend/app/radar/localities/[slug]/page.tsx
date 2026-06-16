import { DEMO_RADAR_LOCALITIES } from "@/lib/radar-demo";
import { LocalityDetailView } from "@/components/radar/LocalityDetailView";

export function generateStaticParams() {
  return DEMO_RADAR_LOCALITIES.map((l) => ({ slug: l.slug }));
}

export default async function RadarLocalityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LocalityDetailView slug={slug} />;
}
