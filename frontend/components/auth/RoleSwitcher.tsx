"use client";

import { useState } from "react";
import { ROLE_LABELS, type AuthRole } from "@/lib/auth/roles";

export function RoleSwitcher({ roles, value, onChange }: { roles: AuthRole[]; value: AuthRole; onChange: (role: AuthRole) => void }) {
  const [selected, setSelected] = useState(value);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => {
            setSelected(role);
            onChange(role);
          }}
          className={`rounded-md border px-3 py-3 text-left text-sm font-black ${selected === role ? "border-teal bg-teal text-white" : "border-ink/12 bg-white/70 text-ink"}`}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}

