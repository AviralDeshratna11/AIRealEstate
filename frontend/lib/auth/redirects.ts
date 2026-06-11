const DEFAULT_LOCAL_APP_URL = "http://localhost:3000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function safeAbsoluteUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return trimTrailingSlash(url.toString());
  } catch {
    return fallback;
  }
}

function safePath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function getPublicAppUrl() {
  return safeAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL, DEFAULT_LOCAL_APP_URL);
}

export function getAuthCallbackUrl(next = "/auth/onboarding") {
  const configured = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL;
  const callback = configured
    ? safeAbsoluteUrl(configured, `${getPublicAppUrl()}/auth/callback`)
    : `${getPublicAppUrl()}/auth/callback`;
  const url = new URL(callback);
  url.searchParams.set("next", safePath(next, "/auth/onboarding"));
  return url.toString();
}

export function getPasswordResetUrl() {
  return `${getPublicAppUrl()}/auth/reset-password`;
}

export function isLocalPublicAppUrl() {
  const hostname = new URL(getPublicAppUrl()).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

