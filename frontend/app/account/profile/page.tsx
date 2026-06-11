import { UserMenu } from "@/components/auth/UserMenu";

export default function AccountProfilePage() {
  return (
    <main className="min-h-screen p-4 text-ink md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Account</p>
            <h1 className="font-display text-4xl font-black">Profile and consent</h1>
          </div>
          <UserMenu />
        </header>
        <section className="grid gap-4 rounded-lg border border-ink/15 bg-[#fffaf0]/92 p-5 shadow-soft sm:grid-cols-2">
          {["Full name", "Phone", "Avatar URL", "Preferred language", "Preferred contact channel", "Notification preferences", "WhatsApp consent", "Call consent", "Email preferences"].map((field) => (
            <label key={field} className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">{field}</span>
              <input className="mt-2 h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold outline-none focus:border-teal" />
            </label>
          ))}
          <button className="h-11 rounded-md bg-ink px-4 text-sm font-black text-[#fffaf0] hover:bg-teal sm:col-span-2">Save profile</button>
        </section>
      </div>
    </main>
  );
}

