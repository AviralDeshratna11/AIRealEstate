"use client";

import { useEffect, useState } from "react";
import { getBrowserMockUser, isMockAuthEnabled, type AppUser } from "@/lib/auth/mock";
import { supabaseBrowser } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const mockUser = isMockAuthEnabled() ? getBrowserMockUser() : null;
      const session = await supabaseBrowser?.auth.getSession();
      if (!mockUser && !session?.data.session) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setReady(true);
    }
    void check();
  }, []);

  if (!ready) return <div className="p-6 text-sm font-black text-ink/54">Checking session...</div>;
  return children;
}

export type { AppUser };

