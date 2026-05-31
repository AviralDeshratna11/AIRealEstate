import { PropertyIntelligencePage } from "@/components/PropertyIntelligencePage";
import { propertyDetailStaticParams } from "@/lib/property-static-params";

export function generateStaticParams() {
  return propertyDetailStaticParams();
}

export default async function BuyerPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyIntelligencePage propertyId={id} role="buyer" />;
}
