import type { AuthRole } from "@/lib/auth/roles";

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: AuthRole;
  primary_role: AuthRole;
  onboarding_completed: boolean;
  organization_id?: string | null;
  profile_ids?: Record<string, string | null>;
  is_mock?: boolean;
};

export const MOCK_USERS: AppUser[] = [
  { id: "mock-buyer", email: "buyer@astra.local", full_name: "ASTRA Buyer", role: "buyer", primary_role: "buyer", onboarding_completed: true, is_mock: true },
  { id: "mock-manager", email: "manager@astra.local", full_name: "ASTRA Manager", role: "manager", primary_role: "manager", onboarding_completed: true, is_mock: true },
  { id: "mock-broker", email: "broker@astra.local", full_name: "ASTRA Broker", role: "broker", primary_role: "broker", onboarding_completed: true, is_mock: true },
  { id: "mock-crm", email: "crm@astra.local", full_name: "ASTRA CRM User", role: "crm_user", primary_role: "crm_user", onboarding_completed: true, is_mock: true },
  { id: "mock-admin", email: "admin@astra.local", full_name: "ASTRA Admin", role: "admin", primary_role: "admin", onboarding_completed: true, is_mock: true },
];

export const MOCK_STORAGE_KEY = "astra.mock.user";
export const AUTH_COOKIE = "astra-auth";
export const MOCK_COOKIE = "astra-mock-user";
export const ROLE_COOKIE = "astra-role";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isMockAuthEnabled() {
  return process.env.NEXT_PUBLIC_AUTH_MOCK_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getMockUserByEmail(email?: string | null) {
  return MOCK_USERS.find((user) => user.email === email) ?? null;
}

export function setBrowserMockUser(user: AppUser) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  document.cookie = `${MOCK_COOKIE}=${encodeURIComponent(user.email)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  document.cookie = `${ROLE_COOKIE}=${user.role}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function setBrowserAuthCookies(role?: string | null) {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  if (role) {
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  } else {
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
  }
}

export function clearBrowserMockUser() {
  localStorage.removeItem(MOCK_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${MOCK_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}

export function getBrowserMockUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppUser;
    return getMockUserByEmail(parsed.email) ?? parsed;
  } catch {
    return null;
  }
}
