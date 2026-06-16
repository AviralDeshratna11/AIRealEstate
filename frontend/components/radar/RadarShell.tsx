"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Radar } from "lucide-react";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/radar", label: "Dashboard" },
  { href: "/radar/map", label: "Map" },
  { href: "/radar/localities", label: "Localities" },
  { href: "/radar/projects", label: "Projects" },
  { href: "/radar/redevelopment", label: "Redevelopment" },
  { href: "/radar/infrastructure", label: "Infrastructure" },
  { href: "/radar/compare", label: "Compare" },
  { href: "/radar/watchlist", label: "Watchlist" },
  { href: "/radar/alerts", label: "Alerts" },
  { href: "/radar/reports", label: "Reports" },
  { href: "/radar/admin", label: "Admin" },
];

export function RadarShell({
  children,
  active,
  title,
  kicker = "Mumbai Redevelopment Radar",
  subtitle,
  wide,
}: {
  children: React.ReactNode;
  active?: string;
  title?: string;
  kicker?: string;
  subtitle?: string;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const current = active ?? pathname ?? "/radar";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink/12 bg-ivory/85 backdrop-blur">
        <div className={clsx("mx-auto flex flex-col gap-3 px-5 py-3", wide ? "max-w-[1500px]" : "max-w-7xl")}>
          <div className="flex items-center justify-between gap-4">
            <Link href="/radar" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[3px] bg-ink text-ivory">
                <Radar size={18} />
              </span>
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-gold">ASTRA</span>
                <span className="lx-display block text-lg font-light leading-none text-ink">Redevelopment Radar</span>
              </span>
            </Link>
            <Link href="/workspace" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/60 hover:text-ink">
              ← Back to ASTRA
            </Link>
          </div>
          <nav className="-mx-1 flex items-center gap-1 overflow-x-auto pb-1">
            {NAV.map((item) => {
              const isActive = item.href === "/radar" ? current === "/radar" : current.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "whitespace-nowrap rounded-[3px] px-3 py-1.5 text-[12px] font-semibold transition",
                    isActive ? "bg-ink text-ivory" : "text-ink/65 hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className={clsx("mx-auto px-5 py-8", wide ? "max-w-[1500px]" : "max-w-7xl")}>
        {title ? (
          <div className="mb-7">
            <span className="flex items-center gap-2">
              <span className="h-px w-10 bg-gold" />
              <span className="radar-kicker">{kicker}</span>
            </span>
            <h1 className="lx-display mt-2 text-4xl font-light leading-tight text-ink md:text-5xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/65">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
