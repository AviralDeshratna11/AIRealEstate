import { BrokerPortal } from "@/components/BrokerPortal";

export function generateStaticParams() {
  return [{ id: "buyer-demo-1" }, { id: "buyer-demo-2" }, { id: "buyer-demo-3" }];
}

export default async function BrokerBuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrokerPortal view="buyer-detail" id={id} />;
}
