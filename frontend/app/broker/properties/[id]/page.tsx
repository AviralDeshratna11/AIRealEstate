import { BrokerPortal } from "@/components/BrokerPortal";
import { MANAGER_DEMO_LISTING_IDS } from "@/lib/api";

export function generateStaticParams() {
  return MANAGER_DEMO_LISTING_IDS.map((id) => ({ id }));
}

export default async function BrokerPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrokerPortal view="property-detail" id={id} />;
}
