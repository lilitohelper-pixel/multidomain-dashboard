import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import NavTabs from "./NavTabs";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { getUserLanguage } from "@/lib/i18n";
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
      <header className="bg-[var(--nav-bg)]">
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 flex flex-wrap items-center justify-end gap-3 text-sm text-[var(--nav-muted)]">
          <WorkspaceSwitcher userId={user.id} workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} lang={lang} />
          <LanguageSwitcher userId={user.id} lang={lang} />
          <ThemeSwitcher inline lang={lang} />
          <span className="hidden sm:inline truncate max-w-[12rem]">{user.email}</span>
          <SignOutButton lang={lang} />
        </div>
        <NavTabs lang={lang} />
      </header>
      <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-full overflow-x-hidden">{children}</main>
    </div>
  );
}
