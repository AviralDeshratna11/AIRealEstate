"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { getPasswordResetUrl } from "@/lib/auth/redirects";
import { supabaseBrowser } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabaseBrowser) {
      setMessage("Password reset requires Supabase configuration.");
      return;
    }
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetUrl(),
    });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
      {message && <p className="rounded-md border border-ink/10 bg-white/72 px-3 py-2 text-sm font-bold">{message}</p>}
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-black text-[#f9fafb] hover:bg-teal">
        <Mail size={17} />
        Send reset link
      </button>
    </form>
  );
}
