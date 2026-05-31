import { XRPropertyViewer } from "@/components/XRPropertyViewer";
import { propertyDetailStaticParams } from "@/lib/property-static-params";

export function generateStaticParams() {
  return propertyDetailStaticParams();
}

export default async function ManagerPropertyXRPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <XRPropertyViewer propertyId={id} role="manager" />;
}
