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
    <nav className="mx-4 sm:mx-6 flex rounded-t-lg border border-b-0 border-white/25 divide-x divide-white/25 overflow-hidden">
      {TABS.map((tab) => {
        const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 truncate text-center px-1 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
              active ? "bg-white/15 text-[var(--nav-text)]" : "text-[var(--nav-muted)] hover:bg-white/5 hover:text-[var(--nav-text)]"
            }`}
          >
            {t(lang, tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
