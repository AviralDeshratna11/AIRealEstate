"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { getBrowserMockUser, isMockAuthEnabled } from "@/lib/auth/mock";
import { isAuthRole } from "@/lib/auth/roles";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string, path: string) {
    super(formatApiError(status, body, path));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function formatApiError(status: number, body: string, path: string) {
  let detail = body;
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string") detail = parsed.detail;
  } catch {
    // Keep the raw response body when the backend did not return JSON.
  }
  if (status === 401) return `Session expired or missing for ${path}. Please sign in again.`;
  if (status === 403) return `Permission denied for ${path}: ${detail || "your account role is not allowed."}`;
  return detail || `Request failed for ${path} with status ${status}.`;
}

async function repairBackendRoleFromSession() {
  const auth = await supabaseBrowser?.auth.getUser();
  const user = auth?.data.user;
  const role = user?.user_metadata?.role;
  if (!isAuthRole(role) || role === "admin") return false;
  const session = await supabaseBrowser?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) return false;

  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      full_name: user?.user_metadata?.full_name || user?.email,
      metadata: user?.user_metadata || {},
    }),
    cache: "no-store",
  });
  return response.ok;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, options: { public?: boolean; repaired?: boolean } = {}): Promise<T> {
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
  if (response.status === 403 && !options.public && !options.repaired && await repairBackendRoleFromSession()) {
    return apiFetch<T>(path, init, { ...options, repaired: true });
  }
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (response.status === 403 && typeof window !== "undefined") {
    window.location.assign("/auth/unauthorized");
  }
  if (!response.ok) throw new ApiError(response.status, await response.text(), path);
  return response.json();
}
