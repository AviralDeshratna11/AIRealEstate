"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, Shield, UsersRound, XCircle } from "lucide-react";
import type { BrokerTieup } from "@/lib/api";
import { decideManagerTieup, getManagerTieupRequests } from "@/lib/api";

export function ManagerTieupRequests() {
  const [requests, setRequests] = useState<BrokerTieup[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getManagerTieupRequests().then(setRequests).catch(console.error);
  }, []);

  async function decide(item: BrokerTieup, action: "approve" | "reject" | "update-terms") {
    setBusy(`${action}-${item.id}`);
    try {
      const updated = await decideManagerTieup(item.id, action, item);
      setRequests((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-4 text-slate-950 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">Manager Selling Portal</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Broker tie-up requests</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Approve, reject, or modify broker inventory access with AI recommendations, marketing restrictions, PropertyPool rights, attribution rules, and commission visibility.</p>
            </div>
            <Link href="/manager" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              <BriefcaseBusiness size={16} />
              Back to Manager OS
            </Link>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((item) => (
            <section key={item.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{item.status.replace(/_/g, " ")}</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">{item.property_title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.intended_buyer_segment} · {item.expected_buyer_count} expected buyers</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{item.requested_commission}% requested</span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Metric label="Broker trust" value={`${String(item.ai_recommendation_json.fit_score || 86)}/100`} />
                <Metric label="Risk level" value={String(item.ai_recommendation_json.risk_level || "medium")} />
                <Metric label="Validity" value={`${item.requested_validity_days} days`} />
              </div>

              <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950">
                  <Shield size={16} />
                  AI recommendation
                </div>
                <p className="text-sm leading-7 text-slate-600">Approve with verified-claims marketing, 90-day attribution protection, document-summary-only sharing until buyer qualification, and PropertyPool rights only for pre-qualified buyers.</p>
              </div>

              <div className="mt-5 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p>Channels: {item.marketing_channels.join(", ")}</p>
                <p>PropertyPool rights: {item.requested_propertypool_rights ? "requested" : "not requested"}</p>
                <p>Exclusivity: {item.requested_exclusivity ? "requested" : "non-exclusive"}</p>
                <p>Attribution: timestamped buyer-property records</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => decide(item, "approve")} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
                  <BadgeCheck size={16} />
                  {busy === `approve-${item.id}` ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => decide(item, "update-terms")} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
                  <UsersRound size={16} />
                  Modify terms
                </button>
                <button onClick={() => decide(item, "reject")} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800">
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div>;
}

