import { CRMPortal } from "@/components/CRMPortal";

export function generateStaticParams() {
  return [
    { id: "crm-opp-demo-1" },
    { id: "crm-opp-demo-2" },
    { id: "crm-opp-demo-3" },
    { id: "crm-opp-demo-4" },
    { id: "crm-opp-demo-5" },
  ];
}

export default async function CRMOpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CRMPortal view="opportunity-detail" id={id} />;
}
