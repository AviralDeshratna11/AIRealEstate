"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import { setBrowserAuthCookies } from "@/lib/auth/mock";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AuthRole } from "@/lib/auth/roles";

const roleOptions: Array<{ label: string; role: AuthRole }> = [
  { label: "I am a buyer", role: "buyer" },
  { label: "I am a property manager / seller", role: "manager" },
  { label: "I am a broker / agent", role: "broker" },
  { label: "I am a sales team member", role: "crm_user" },
];

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AuthRole>("buyer");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!terms) {
      setMessage("Accept the terms to continue.");
      return;
    }
    setLoading(true);
    try {
      if (!supabaseBrowser) throw new Error("Supabase is not configured. Use Demo Auth Mode on login.");
      const { data, error } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl("/auth/onboarding"),
          data: { full_name: fullName, phone, role, onboarding_completed: false },
        },
      });
      if (error) throw error;
      if (data.session) setBrowserAuthCookies(role);
      window.location.assign(data.session ? "/auth/onboarding" : "/auth/verify-email");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleLoginButton label="Sign up with Google" next="/auth/onboarding" />
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Full name</span>
            <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Email</span>
            <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Password</span>
            <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Confirm</span>
            <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Phone optional</span>
            <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-2">
          {roleOptions.map((item) => (
            <label key={item.role} className="flex cursor-pointer items-center gap-3 rounded-md border border-ink/12 bg-white/64 px-3 py-3 text-sm font-black hover:bg-white">
              <input type="radio" checked={role === item.role} onChange={() => setRole(item.role)} />
              {item.label}
            </label>
          ))}
        </div>
        <label className="flex items-start gap-2 text-sm font-semibold text-ink/58">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-1 h-4 w-4" />
          I accept ASTRA terms, privacy rules, and consent-aware communication policies.
        </label>
        {message && <p className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}
        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-black text-[#f9fafb] transition hover:bg-teal disabled:opacity-60">
          {loading ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
          Create account
        </button>
      </form>
      <p className="text-center text-sm font-semibold text-ink/56">
        Already have an account? <Link href="/login" className="font-black text-teal hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
