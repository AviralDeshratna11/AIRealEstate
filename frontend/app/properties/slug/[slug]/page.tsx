import { PropertyIntelligencePage } from "@/components/PropertyIntelligencePage";
import { DEMO_MANAGER_LISTINGS } from "@/lib/manager-demo";

export function generateStaticParams() {
  return DEMO_MANAGER_LISTINGS.map((listing) => ({ slug: listing.slug }));
}

export default async function PublicPropertyBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PropertyIntelligencePage propertyId={slug} role="public" />;
}
