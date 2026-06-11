import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthCard kicker="Account recovery" title="Reset your ASTRA password" subtitle="Enter your email and ASTRA will send a secure reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}

