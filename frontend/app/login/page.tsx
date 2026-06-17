import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      kicker="Secure sign in"
      title="Welcome back to ASTRA"
      subtitle="Sign in to manage properties, buyers, brokers, tours, and CRM workflows."
    >
      {/* `next`/`error` are read from the URL client-side (in LoginForm) so this
          page can be statically exported for GitHub Pages. */}
      <LoginForm />
    </AuthCard>
  );
}
