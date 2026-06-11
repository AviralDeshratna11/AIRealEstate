import Link from "next/link";

export function AuthCard({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-6 text-ink sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_520px]">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm font-black text-[#fffaf0]">
            ASTRA Estate
          </Link>
          <h1 className="mt-8 max-w-2xl font-display text-6xl font-black leading-none">
            Mumbai real estate, secured for every operator.
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-ink/62">
            One identity layer for buyers, managers, brokers, CRM teams, XR tours, calls, documents, and automation.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {["Role gated", "Supabase ready", "Demo mode"].map((item) => (
              <div key={item} className="rounded-lg border border-ink/15 bg-[#fffaf0]/75 p-4 text-sm font-black">
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-ink/15 bg-[#fffaf0]/94 p-5 shadow-soft backdrop-blur sm:p-7">
          <Link href="/" className="mb-7 inline-flex items-center rounded-md bg-ink px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#fffaf0] lg:hidden">
            ASTRA
          </Link>
          {kicker && <p className="section-kicker">{kicker}</p>}
          <h2 className="mt-2 font-display text-4xl font-black leading-none text-ink">{title}</h2>
          {subtitle && <p className="mt-3 text-sm font-semibold leading-6 text-ink/58">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

