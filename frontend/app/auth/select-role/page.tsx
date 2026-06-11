import { AuthCard } from "@/components/auth/AuthCard";
import { OnboardingStepper } from "@/components/auth/OnboardingStepper";

export default function SelectRolePage() {
  return (
    <AuthCard kicker="Select role" title="Choose your ASTRA role" subtitle="Your role controls which portals and APIs you can access. Admin cannot be self-assigned.">
      <OnboardingStepper />
    </AuthCard>
  );
}

