import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <header className="bg-[var(--nav-bg)] border-b border-[var(--border)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/dashboard" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              Today
            </Link>
            <Link href="/dashboard/tasks" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              Tasks
            </Link>
            <Link href="/dashboard/expenses" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              Expenses
            </Link>
            <Link href="/dashboard/calendar" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              Calendar
            </Link>
            <Link href="/dashboard/connect-telegram" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              Telegram
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm text-[var(--nav-muted)]">
            <ThemeSwitcher inline />
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
