import { LandingPage } from "@/components/LandingPage";
import { OAuthRedirectGate } from "@/components/auth/OAuthRedirectGate";

export default function HomePage() {
  // OAuth/email landing params (?code, ?error) are handled client-side by
  // OAuthRedirectGate so this page can be statically exported for GitHub Pages.
  return (
    <>
      <OAuthRedirectGate />
      <LandingPage />
    </>
  );
}
