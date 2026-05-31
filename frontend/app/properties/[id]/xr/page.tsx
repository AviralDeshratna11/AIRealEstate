import { XRPropertyViewer } from "@/components/XRPropertyViewer";
import { propertyDetailStaticParams } from "@/lib/property-static-params";

export function generateStaticParams() {
  return propertyDetailStaticParams();
}

export default async function PublicPropertyXRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <XRPropertyViewer propertyId={id} role="public" />;
}
