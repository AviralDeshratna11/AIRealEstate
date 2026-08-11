import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export default function VerifyEmailPage() {
  return (
    <AuthCard kicker="Email verification" title="Confirm your ASTRA account" subtitle="Check your inbox for the secure confirmation link. Once confirmed, return here to continue onboarding.">
      <Link href="/login" className="flex h-12 items-center justify-center rounded-md bg-ink px-4 text-sm font-black text-[#f9fafb] hover:bg-teal">
        Back to login
      </Link>
    </AuthCard>
  );
}

