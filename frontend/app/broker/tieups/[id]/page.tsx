import { BrokerPortal } from "@/components/BrokerPortal";

export function generateStaticParams() {
  return [{ id: "tieup-demo-1" }];
}

export default async function BrokerTieupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrokerPortal view="tieup-detail" id={id} />;
}
