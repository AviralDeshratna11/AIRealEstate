import { UserMenu } from "@/components/auth/UserMenu";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function AccountSecurityPage() {
  return (
    <main className="min-h-screen p-4 text-ink md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Security</p>
            <h1 className="font-display text-4xl font-black">Password and session</h1>
          </div>
          <UserMenu />
        </header>
        <section className="space-y-5 rounded-lg border border-ink/15 bg-[#fffaf0]/92 p-5 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-3">
            {["Provider", "Last login", "Marketing opt-out"].map((item) => (
              <div key={item} className="rounded-md border border-ink/10 bg-white/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/42">{item}</p>
                <p className="mt-2 font-black">Managed by ASTRA Auth</p>
              </div>
            ))}
          </div>
          <ResetPasswordForm />
        </section>
      </div>
    </main>
  );
}

