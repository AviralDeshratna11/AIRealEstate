"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabaseBrowser) {
      setMessage("Password reset requires Supabase configuration.");
      return;
    }
    const { error } = await supabaseBrowser.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated. You can sign in now.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
      {message && <p className="rounded-md border border-ink/10 bg-white/72 px-3 py-2 text-sm font-bold">{message}</p>}
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-black text-[#f9fafb] hover:bg-teal">
        <KeyRound size={17} />
        Update password
      </button>
    </form>
  );
}

