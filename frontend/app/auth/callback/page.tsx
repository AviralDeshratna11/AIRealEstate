"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { setBrowserAuthCookies } from "@/lib/auth/mock";
import { dashboardForRole } from "@/lib/auth/roles";
import { syncBrowserAuthFromBackend } from "@/lib/auth/session";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/auth/onboarding";
  return value;
}

export default function AuthCallbackPage() {
  useEffect(() => {
    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const next = safeNext(params.get("next"));
      const code = params.get("code");
      if (code) {
        const { error } = (await supabaseBrowser?.auth.exchangeCodeForSession(code)) ?? {};
        if (error) {
          const message = error.message.toLowerCase().includes("pkce")
            ? "That sign-in link was stale. Please start sign in again from this browser."
            : error.message;
          window.location.replace(`/login?error=${encodeURIComponent(message)}`);
          return;
        }
      }

      const { data } = (await supabaseBrowser?.auth.getSession()) ?? { data: { session: null } };
      const user = data.session?.user;
      if (!user) {
        window.location.replace("/login?error=session_not_created");
        return;
      }

      const role = user.user_metadata?.role;
      const backendUser = await syncBrowserAuthFromBackend(role);
      const finalRole = backendUser?.role || role;
      setBrowserAuthCookies(finalRole);
      const destination = (backendUser?.onboarding_completed || user.user_metadata?.onboarding_completed) ? dashboardForRole(finalRole) : next;
      window.location.replace(destination);
    }
    void finish();
  }, []);

  return <main className="grid min-h-screen place-items-center p-6 text-sm font-black text-ink/62">Completing secure sign in...</main>;
}
