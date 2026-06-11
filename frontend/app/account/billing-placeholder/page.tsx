import { UserMenu } from "@/components/auth/UserMenu";

export default function BillingPlaceholderPage() {
  return (
    <main className="min-h-screen p-4 text-ink md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-4xl font-black">Billing</h1>
          <UserMenu />
        </div>
        <section className="rounded-lg border border-ink/15 bg-[#fffaf0]/92 p-5 shadow-soft">
          <p className="font-semibold text-ink/62">Billing is reserved for a future ASTRA subscription module.</p>
        </section>
      </div>
    </main>
  );
}

