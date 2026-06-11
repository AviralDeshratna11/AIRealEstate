import type { AuthRole } from "@/lib/auth/roles";

export const ROUTE_ACCESS: Array<{ prefix: string; roles: AuthRole[] }> = [
  { prefix: "/buyer", roles: ["buyer", "admin"] },
  { prefix: "/manager", roles: ["manager", "admin"] },
  { prefix: "/broker", roles: ["broker", "admin"] },
  { prefix: "/crm", roles: ["crm_user", "manager", "admin"] },
  { prefix: "/account", roles: ["buyer", "manager", "broker", "crm_user", "admin"] },
];

export const PUBLIC_ROUTES = [
  "/",
  "/properties",
  "/crm-app",
  "/login",
  "/signup",
  "/auth/callback",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/unauthorized",
];

export function rolesForPath(pathname: string): AuthRole[] | null {
  const rule = ROUTE_ACCESS.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  return rule?.roles ?? null;
}

export function canAccessPath(role: AuthRole | null | undefined, pathname: string) {
  const roles = rolesForPath(pathname);
  if (!roles) return true;
  return Boolean(role && roles.includes(role));
}

export const ROLE_PERMISSIONS: Record<AuthRole, string[]> = {
  buyer: ["buyer:read", "properties:shortlist", "tours:book", "offers:create"],
  manager: ["manager:read", "manager:write", "listings:write", "crm:read", "tieups:approve"],
  broker: ["broker:read", "broker:write", "propertypool:use", "tieups:request"],
  crm_user: ["crm:read", "crm:write", "campaigns:write", "reports:read"],
  admin: ["*"],
};

