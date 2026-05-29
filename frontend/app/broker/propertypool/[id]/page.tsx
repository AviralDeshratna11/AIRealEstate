import { BrokerPortal } from "@/components/BrokerPortal";

export function generateStaticParams() {
  return [{ id: "pool-demo-1" }];
}

export default async function BrokerPropertyPoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrokerPortal view="propertypool-detail" id={id} />;
}
