import { AuthCard } from "@/components/auth/AuthCard";
import { OnboardingStepper } from "@/components/auth/OnboardingStepper";

export default function OnboardingPage() {
  return (
    <AuthCard kicker="Role onboarding" title="Set up your ASTRA workspace" subtitle="Choose your operating role and add the profile details needed for permissions, automation, calls, and WhatsApp consent.">
      <OnboardingStepper />
    </AuthCard>
  );
}

