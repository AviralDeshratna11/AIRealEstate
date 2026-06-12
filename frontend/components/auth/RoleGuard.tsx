"use client";

import { useEffect, useState } from "react";
import type { AuthRole } from "@/lib/auth/roles";
import { getBrowserMockUser, isMockAuthEnabled } from "@/lib/auth/mock";
import { supabaseBrowser } from "@/lib/supabase/client";
import { syncBrowserAuthFromBackend } from "@/lib/auth/session";

export function RoleGuard({ roles, children }: { roles: AuthRole[]; children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const mockUser = isMockAuthEnabled() ? getBrowserMockUser() : null;
      const authRole = (await supabaseBrowser?.auth.getUser())?.data.user?.user_metadata?.role;
      const backendUser = mockUser ? null : await syncBrowserAuthFromBackend(authRole);
      const role = mockUser?.role ?? backendUser?.role ?? authRole;
      if (!role) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!roles.includes(role)) {
        window.location.assign("/auth/unauthorized");
        return;
      }
      setAllowed(true);
    }
    void check();
  }, [roles]);

  if (!allowed) return <div className="p-6 text-sm font-black text-ink/54">Checking permissions...</div>;
  return children;
}
