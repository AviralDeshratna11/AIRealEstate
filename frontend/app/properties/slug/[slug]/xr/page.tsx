import { XRPropertyViewer } from "@/components/XRPropertyViewer";
import { DEMO_MANAGER_LISTINGS } from "@/lib/manager-demo";

export function generateStaticParams() {
  return DEMO_MANAGER_LISTINGS.map((listing) => ({ slug: listing.slug }));
}

export default async function PublicPropertySlugXRPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <XRPropertyViewer propertyId={slug} role="public" />;
}
