"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, UserCircle } from "lucide-react";
import { getBrowserMockUser, clearBrowserMockUser, isMockAuthEnabled, setBrowserAuthCookies, type AppUser } from "@/lib/auth/mock";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ROLE_LABELS, dashboardForRole, isAuthRole } from "@/lib/auth/roles";
import { syncBrowserAuthFromBackend } from "@/lib/auth/session";

export function UserMenu() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    async function load() {
      const mock = isMockAuthEnabled() ? getBrowserMockUser() : null;
      if (mock) {
        setUser(mock);
        return;
      }
      const auth = await supabaseBrowser?.auth.getUser();
      const authUser = auth?.data.user;
      const role = authUser?.user_metadata?.role;
      if (authUser?.email) {
        const backendUser = await syncBrowserAuthFromBackend(isAuthRole(role) ? role : null);
        const safeRole = isAuthRole(backendUser?.role) ? backendUser.role : isAuthRole(role) ? role : "buyer";
        setBrowserAuthCookies(safeRole);
        setUser({
          id: backendUser?.id || authUser.id,
          email: backendUser?.email || authUser.email,
          full_name: backendUser?.full_name || authUser.user_metadata?.full_name || authUser.email,
          avatar_url: backendUser?.avatar_url || authUser.user_metadata?.avatar_url,
          role: safeRole,
          primary_role: safeRole,
          onboarding_completed: Boolean(backendUser?.onboarding_completed || authUser.user_metadata?.onboarding_completed),
        });
      }
    }
    void load();
  }, []);

  async function logout() {
    clearBrowserMockUser();
    await supabaseBrowser?.auth.signOut();
    window.location.assign("/login");
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-xs font-black text-ink hover:bg-white">Login</Link>
        <Link href="/signup" className="rounded-md bg-ink px-3 py-2 text-xs font-black text-[#fffaf0] hover:bg-teal">Signup</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink/15 bg-[#fffaf0]/90 p-2 shadow-sm">
      <Link href={dashboardForRole(user.role)} className="hidden text-right sm:block">
        <span className="block text-sm font-black leading-tight text-ink">{user.full_name}</span>
        <span className="block text-xs font-bold text-teal">{ROLE_LABELS[user.role]}</span>
      </Link>
      <Link href="/account/profile" className="grid h-9 w-9 place-items-center rounded-md bg-ink/8 text-ink" title="Profile">
        <UserCircle size={19} />
      </Link>
      <Link href="/account/security" className="grid h-9 w-9 place-items-center rounded-md bg-ink/8 text-ink" title="Account security">
        <Settings size={18} />
      </Link>
      <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-md bg-coral text-white" title="Logout">
        <LogOut size={18} />
      </button>
    </div>
  );
}
