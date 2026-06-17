"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Handles Supabase OAuth/email landing params on "/" entirely on the client, so
 * the home page can be statically exported (no server-side `searchParams`).
 *
 * - `?code=...`  -> forward to /auth/callback to complete the exchange.
 * - `?error=...` -> forward to /login with the message.
 *
 * Uses the Next router so the configured basePath is respected on GitHub Pages.
 */
export function OAuthRedirectGate() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      router.replace(`/auth/callback?${params.toString()}`);
      return;
    }
    if (params.get("error") || params.get("error_description")) {
      const message = params.get("error_description") || params.get("error_code") || params.get("error") || "Authentication failed";
      router.replace(`/login?error=${encodeURIComponent(message)}`);
    }
  }, [router]);

  return null;
}
