export const AUTH_ROLES = ["buyer", "manager", "broker", "crm_user", "admin"] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export const ROLE_LABELS: Record<AuthRole, string> = {
  buyer: "Buyer",
  manager: "Manager",
  broker: "Broker",
  crm_user: "CRM user",
  admin: "Admin",
};

export const ROLE_DASHBOARDS: Record<AuthRole, string> = {
  buyer: "/buyer",
  manager: "/manager",
  broker: "/broker",
  crm_user: "/crm",
  admin: "/crm",
};

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

export function dashboardForRole(role?: string | null) {
  return isAuthRole(role) ? ROLE_DASHBOARDS[role] : "/auth/onboarding";
}

