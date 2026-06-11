"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { getBrowserMockUser, isMockAuthEnabled } from "@/lib/auth/mock";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string, init: RequestInit = {}, options: { public?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.public) {
    const mockUser = isMockAuthEnabled() ? getBrowserMockUser() : null;
    if (mockUser) {
      headers.set("Authorization", `Bearer mock:${mockUser.role}:${mockUser.email}`);
    } else {
      const session = await supabaseBrowser?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: init.cache ?? "no-store" });
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (response.status === 403 && typeof window !== "undefined") {
    window.location.assign("/auth/unauthorized");
  }
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
