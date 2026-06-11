import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthCard
      kicker="Secure sign in"
      title="Welcome back to ASTRA"
      subtitle="Sign in to manage properties, buyers, brokers, tours, and CRM workflows."
    >
      <LoginForm next={params?.next || "/auth/onboarding"} initialError={params?.error} />
    </AuthCard>
  );
}
