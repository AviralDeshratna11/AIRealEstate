import { redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (typeof params?.code === "string") {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
      else if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    }
    redirect(`/auth/callback?${query.toString()}`);
  }
  if (params?.error || params?.error_description) {
    const message = String(params.error_description || params.error_code || params.error || "Authentication failed");
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
  return <LandingPage />;
}
