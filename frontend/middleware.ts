import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, MOCK_COOKIE, ROLE_COOKIE, getMockUserByEmail } from "@/lib/auth/mock";
import { isAuthRole } from "@/lib/auth/roles";
import { rolesForPath } from "@/lib/auth/permissions";

function hasSupabaseCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.value);
}

function safeNext(pathname: string, search: string) {
  const next = `${pathname}${search}`;
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requiredRoles = rolesForPath(pathname);
  if (!requiredRoles) return NextResponse.next();

  const mock = getMockUserByEmail(request.cookies.get(MOCK_COOKIE)?.value);
  const cookieRole = request.cookies.get(ROLE_COOKIE)?.value;
  const role = mock?.role ?? (isAuthRole(cookieRole) ? cookieRole : null);
  const authenticated = Boolean(mock || request.cookies.get(AUTH_COOKIE)?.value || hasSupabaseCookie(request));

  if (!authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", safeNext(pathname, search));
    return NextResponse.redirect(url);
  }

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!requiredRoles.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/unauthorized";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/manager/:path*", "/broker/:path*", "/crm/:path*", "/account/:path*"],
};
