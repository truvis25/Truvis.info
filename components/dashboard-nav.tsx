"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashboardNavItem = { href: string; label: string };

// Persistent dashboard sub-navigation (DSH-1). Items are role-filtered by the
// server layout; active state mirrors the public header's underline pattern.
export function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="border-b border-border bg-card/60"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-1 overflow-x-auto px-6">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-brand ${
                active
                  ? "text-petroleum dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-brand" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
