"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Mail, ShieldCheck } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MOCK_USERS, isMockAuthEnabled, setBrowserAuthCookies, setBrowserMockUser } from "@/lib/auth/mock";
import { getAuthCallbackUrl, isLocalPublicAppUrl } from "@/lib/auth/redirects";
import { dashboardForRole } from "@/lib/auth/roles";
import { syncBrowserAuthFromBackend } from "@/lib/auth/session";

export function LoginForm({ next: nextProp = "/auth/onboarding", initialError }: { next?: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState(nextProp);
  const [message, setMessage] = useState<string | null>(initialError ? decodeURIComponent(initialError) : null);

  // Read `next`/`error` from the URL on the client so this page can be statically
  // exported (no server-side `searchParams`). Runtime behavior is unchanged.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("next");
    if (n) setNext(n);
    const e = params.get("error");
    if (e) setMessage(decodeURIComponent(e));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!supabaseBrowser) throw new Error("Supabase is not configured. Use Demo Auth Mode below.");
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const role = data.user?.user_metadata?.role;
      const backendUser = await syncBrowserAuthFromBackend(role);
      const finalRole = backendUser?.role || role;
      setBrowserAuthCookies(finalRole);
      window.location.assign((backendUser?.onboarding_completed || data.user?.user_metadata?.onboarding_completed) ? dashboardForRole(finalRole) : next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    if (!supabaseBrowser) {
      setMessage("Magic link requires Supabase configuration.");
      return;
    }
    setLoading(true);
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthCallbackUrl(next) },
    });
    setLoading(false);
    setMessage(error ? error.message : "Secure login link sent to your email.");
  }

  return (
    <div className="space-y-5">
      {isMockAuthEnabled() && (
        <div className="rounded-lg border border-teal/20 bg-teal/10 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-teal">
            <ShieldCheck size={15} />
            Demo Auth Mode
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {MOCK_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => {
                  setBrowserMockUser(user);
                  window.location.assign(dashboardForRole(user.role));
                }}
                className="rounded-md border border-ink/10 bg-white/70 px-3 py-2 text-left text-xs font-black hover:bg-white"
              >
                {user.full_name}
                <span className="block font-semibold text-ink/48">{user.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <GoogleLoginButton next={next} />
      {isLocalPublicAppUrl() && supabaseBrowser && (
        <p className="rounded-md border border-brass/25 bg-brass/10 px-3 py-2 text-xs font-bold leading-5 text-ink/66">
          Supabase email links are currently configured for localhost. Use a Vercel, ngrok, or LAN URL in NEXT_PUBLIC_APP_URL when testing from mobile.
        </p>
      )}

      <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-ink/38">
        <span className="h-px flex-1 bg-ink/12" />
        Email
        <span className="h-px flex-1 bg-ink/12" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Email</span>
          <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Password</span>
          <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
        </label>
        <div className="flex items-center justify-between gap-3 text-sm font-bold">
          <label className="inline-flex items-center gap-2 text-ink/58">
            <input type="checkbox" className="h-4 w-4 rounded border-ink/20" />
            Remember me
          </label>
          <Link href="/auth/forgot-password" className="text-teal hover:underline">Forgot password?</Link>
        </div>
        {message && <p className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}
        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-black text-[#f9fafb] transition hover:bg-teal disabled:opacity-60">
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Eye size={17} />}
          Sign in
        </button>
      </form>
      <button type="button" onClick={magicLink} className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-ink/15 bg-transparent px-4 text-sm font-black text-ink hover:bg-white/70">
        <Mail size={17} />
        Send magic link
      </button>
      <p className="text-center text-sm font-semibold text-ink/56">
        New to ASTRA? <Link href="/signup" className="font-black text-teal hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
