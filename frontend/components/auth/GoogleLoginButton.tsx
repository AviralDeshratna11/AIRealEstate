"use client";

import { Chrome } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";

export function GoogleLoginButton({ label = "Continue with Google", next = "/auth/onboarding" }: { label?: string; next?: string }) {
  async function login() {
    if (!supabaseBrowser) return;
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthCallbackUrl(next) },
    });
  }

  return (
    <button
      type="button"
      onClick={login}
      disabled={!supabaseBrowser}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-4 text-sm font-black text-ink transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Chrome size={18} />
      {label}
    </button>
  );
}
