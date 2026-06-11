import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthCard kicker="New password" title="Set a fresh password" subtitle="Use a strong password for your ASTRA account.">
      <ResetPasswordForm />
    </AuthCard>
  );
}

