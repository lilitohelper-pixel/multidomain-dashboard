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
    <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6">
      {TABS.map((tab) => {
        const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-[var(--action)] text-[var(--nav-text)]"
                : "border-transparent text-[var(--nav-muted)] hover:text-[var(--nav-text)] hover:border-white/20"
            }`}
          >
            {t(lang, tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
