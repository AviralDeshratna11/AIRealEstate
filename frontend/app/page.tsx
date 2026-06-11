import { redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; error_code?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  if (params?.error || params?.error_description) {
    const message = params.error_description || params.error_code || params.error || "Authentication failed";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
  return <LandingPage />;
}
