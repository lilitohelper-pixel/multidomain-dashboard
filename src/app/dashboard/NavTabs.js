"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";

const TABS = [
  { href: "/dashboard", key: "nav_today" },
  { href: "/dashboard/tasks", key: "nav_tasks" },
  { href: "/dashboard/expenses", key: "nav_expenses" },
  { href: "/dashboard/calendar", key: "nav_calendar" },
  { href: "/dashboard/connect-telegram", key: "nav_telegram" },
];

export default function NavTabs({ lang }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto px-4 sm:px-6 pb-3">
      {TABS.map((tab) => {
        const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              active
                ? "border-[var(--action)] bg-[var(--action)]/15 text-[var(--nav-text)]"
                : "border-white/15 text-[var(--nav-muted)] hover:text-[var(--nav-text)] hover:border-white/30"
            }`}
          >
            {t(lang, tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
