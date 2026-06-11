"use client";

import { useEffect } from "react";
import { clearBrowserMockUser } from "@/lib/auth/mock";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      clearBrowserMockUser();
      await supabaseBrowser?.auth.signOut();
      window.location.replace("/login");
    }
    void logout();
  }, []);

  return <main className="grid min-h-screen place-items-center p-6 text-sm font-black text-ink/62">Signing out...</main>;
}
