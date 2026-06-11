"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getBrowserMockUser, isMockAuthEnabled, setBrowserAuthCookies, setBrowserMockUser } from "@/lib/auth/mock";
import { dashboardForRole, type AuthRole } from "@/lib/auth/roles";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { supabaseBrowser } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api/client";

const fieldsByRole: Record<AuthRole, string[]> = {
  buyer: ["phone", "budget range", "preferred localities", "property type", "BHK", "purchase purpose", "buying timeline", "loan requirement", "EMI comfort", "family size"],
  manager: ["company name", "phone", "operating localities", "RERA/company details", "property categories", "first listing intent"],
  broker: ["agency name", "phone", "WhatsApp number", "RERA agent ID", "operating localities", "years of experience", "buyer network size", "specialization"],
  crm_user: ["organization", "team role", "phone", "invited by manager"],
  admin: ["organization", "phone", "security contact"],
};

export function OnboardingStepper() {
  const [role, setRole] = useState<AuthRole>("buyer");
  const [fullName, setFullName] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const mock = isMockAuthEnabled() ? getBrowserMockUser() : null;
      if (mock) {
        setRole(mock.role);
        setFullName(mock.full_name);
        return;
      }
      const user = (await supabaseBrowser?.auth.getUser())?.data.user;
      const authRole = user?.user_metadata?.role as AuthRole | undefined;
      if (authRole) setRole(authRole);
      if (user?.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
    }
    void load();
  }, []);

  async function complete(event: React.FormEvent) {
    event.preventDefault();
    if (role === "admin") {
      setMessage("Admin role cannot be self-assigned.");
      return;
    }
    const mock = isMockAuthEnabled() ? getBrowserMockUser() : null;
    if (mock) {
      const updated = { ...mock, full_name: fullName || mock.full_name, role, primary_role: role, onboarding_completed: true };
      setBrowserMockUser(updated);
      window.location.assign(dashboardForRole(role));
      return;
    }
    try {
      await supabaseBrowser?.auth.updateUser({ data: { role, full_name: fullName, onboarding_completed: true } });
      setBrowserAuthCookies(role);
      try {
        await apiFetch("/api/auth/profile", { method: "POST", body: JSON.stringify({ role, full_name: fullName, phone: metadata.phone, metadata }) });
      } catch (profileError) {
        console.warn("ASTRA backend profile sync failed; continuing with Supabase session.", profileError);
      }
      window.location.assign(dashboardForRole(role));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete onboarding.");
    }
  }

  return (
    <form onSubmit={complete} className="space-y-5">
      <RoleSwitcher roles={["buyer", "manager", "broker", "crm_user"]} value={role} onChange={setRole} />
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">Full name</span>
        <input className="mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-3 font-semibold outline-none focus:border-teal" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {fieldsByRole[role].map((field) => (
          <label key={field} className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">{field}</span>
            <input className="mt-2 h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold outline-none focus:border-teal" onChange={(event) => setMetadata((current) => ({ ...current, [field.replace(/\s+/g, "_")]: event.target.value }))} />
          </label>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {["whatsapp_consent", "call_consent", "email_marketing_consent", "do_not_call"].map((field) => (
          <label key={field} className="flex items-center gap-2 rounded-md border border-ink/12 bg-white/64 px-3 py-3 text-sm font-bold">
            <input type="checkbox" onChange={(event) => setMetadata((current) => ({ ...current, [field]: String(event.target.checked) }))} />
            {field.replace(/_/g, " ")}
          </label>
        ))}
      </div>
      {message && <p className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-black text-[#fffaf0] hover:bg-teal">
        <CheckCircle2 size={17} />
        Complete onboarding
      </button>
    </form>
  );
}
