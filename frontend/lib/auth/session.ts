"use client";

import { API_URL } from "@/lib/api/client";
import { setBrowserAuthCookies, type AppUser } from "@/lib/auth/mock";
import { isAuthRole, type AuthRole } from "@/lib/auth/roles";
import { supabaseBrowser } from "@/lib/supabase/client";

type BackendUser = AppUser & {
  auth_user_id?: string;
};

async function authedFetch(path: string, init: RequestInit = {}) {
  const session = await supabaseBrowser?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) return null;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  return fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

async function readBackendUser(): Promise<BackendUser | null> {
  const response = await authedFetch("/api/auth/me");
  if (!response?.ok) return null;
  return response.json();
}

async function repairBackendRole(role: AuthRole, fullName?: string | null, metadata?: Record<string, unknown>) {
  if (role === "admin") return null;
  const response = await authedFetch("/api/auth/profile", {
    method: "POST",
    body: JSON.stringify({ role, full_name: fullName, metadata: metadata ?? {} }),
  });
  if (!response?.ok) return null;
  return response.json() as Promise<BackendUser>;
}

export async function syncBrowserAuthFromBackend(fallbackRole?: string | null): Promise<BackendUser | null> {
  const authUser = (await supabaseBrowser?.auth.getUser())?.data.user;
  const safeFallbackRole = isAuthRole(fallbackRole) ? fallbackRole : isAuthRole(authUser?.user_metadata?.role) ? authUser.user_metadata.role : null;
  let backendUser = await readBackendUser();

  if (safeFallbackRole && backendUser?.role !== safeFallbackRole) {
    backendUser = await repairBackendRole(
      safeFallbackRole,
      authUser?.user_metadata?.full_name || authUser?.email,
      authUser?.user_metadata,
    ) ?? backendUser;
  }

  const role = isAuthRole(backendUser?.role) ? backendUser.role : safeFallbackRole;
  setBrowserAuthCookies(role);
  return backendUser;
}
