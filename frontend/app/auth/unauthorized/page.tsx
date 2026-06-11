import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function UnauthorizedPage() {
  return (
    <AuthCard kicker="Permission denied" title="This area needs another role" subtitle="Your account is signed in, but this workspace is not available for the current role.">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-coral/20 bg-coral/10 p-4 text-coral">
          <ShieldAlert size={22} />
          <p className="text-sm font-black">ASTRA blocked this request to prevent unauthorized data access.</p>
        </div>
        <Link href="/auth/onboarding" className="flex h-12 items-center justify-center rounded-md bg-ink px-4 text-sm font-black text-[#fffaf0] hover:bg-teal">
          Review role
        </Link>
      </div>
    </AuthCard>
  );
}

