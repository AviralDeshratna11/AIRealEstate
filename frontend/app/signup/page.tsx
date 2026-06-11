import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthCard
      kicker="Create account"
      title="Join ASTRA"
      subtitle="Create a secure workspace identity for buying, selling, brokerage, CRM, and automation."
    >
      <SignupForm />
    </AuthCard>
  );
}

