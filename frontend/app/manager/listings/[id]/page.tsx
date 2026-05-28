import { ManagerPortal } from "@/components/ManagerPortal";
import { MANAGER_DEMO_LISTING_IDS } from "@/lib/manager-demo";

export function generateStaticParams() {
  return MANAGER_DEMO_LISTING_IDS.map((id) => ({ id }));
}

export default async function ManagerListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ManagerPortal view="detail" listingId={id} />;
}
