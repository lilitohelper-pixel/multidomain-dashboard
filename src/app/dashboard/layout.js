import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { getUserLanguage, t } from "@/lib/i18n";
import { getUserWorkspaces, getActiveWorkspaceId } from "@/lib/workspace";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const lang = await getUserLanguage(supabase, user.id);
  const workspaces = await getUserWorkspaces(supabase, user.id);
  const activeWorkspaceId = await getActiveWorkspaceId(supabase, user.id, workspaces);

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <header className="bg-[var(--nav-bg)] border-b border-[var(--border)]">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
            <Link href="/dashboard" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              {t(lang, "nav_today")}
            </Link>
            <Link href="/dashboard/tasks" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              {t(lang, "nav_tasks")}
            </Link>
            <Link href="/dashboard/expenses" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              {t(lang, "nav_expenses")}
            </Link>
            <Link href="/dashboard/calendar" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              {t(lang, "nav_calendar")}
            </Link>
            <Link href="/dashboard/connect-telegram" className="text-[var(--nav-text)] hover:text-[var(--nav-muted)]">
              {t(lang, "nav_telegram")}
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--nav-muted)]">
            <WorkspaceSwitcher userId={user.id} workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} lang={lang} />
            <LanguageSwitcher userId={user.id} lang={lang} />
            <ThemeSwitcher inline lang={lang} />
            <span className="hidden sm:inline truncate max-w-[12rem]">{user.email}</span>
            <SignOutButton lang={lang} />
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-full overflow-x-hidden">{children}</main>
    </div>
  );
}
