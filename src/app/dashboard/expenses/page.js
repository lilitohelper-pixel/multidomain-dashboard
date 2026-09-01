import { createClient } from "@/lib/supabase/server";
import ExpenseCategoryCharts from "./ExpenseCategoryCharts";
import AllExpensesTable from "./AllExpensesTable";
import { getUserLanguage, t } from "@/lib/i18n";
import { getUserWorkspaces, getActiveWorkspaceId } from "@/lib/workspace";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = await getUserLanguage(supabase, user.id);
  const workspaces = await getUserWorkspaces(supabase, user.id);
  const activeWorkspaceId = await getActiveWorkspaceId(supabase, user.id, workspaces);

  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, workspaces(name, is_personal)")
      .eq("workspace_id", activeWorkspaceId)
      .order("date", { ascending: false }),
    supabase
      .from("expense_categories")
      .select("id, parent_id, name, workspace_id, workspaces(name, is_personal)")
      .or(`workspace_id.is.null,workspace_id.eq.${activeWorkspaceId}`),
  ]);

  const allCategories = categories || [];
  const topLevelCategories = allCategories.filter((c) => c.parent_id === null).map((c) => ({ id: c.id, name: c.name }));
  const customCategories = allCategories.filter((c) => c.workspace_id !== null);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">{t(lang, "expenses_title")}</h1>

      <ExpenseCategoryCharts
        expenses={expenses || []}
        categories={allCategories}
        workspaces={workspaces}
        defaultWorkspaceId={activeWorkspaceId}
        topLevelCategories={topLevelCategories}
        initialCustomCategories={customCategories}
        currentUserId={user.id}
        lang={lang}
      />

      <section>
        <h2 className="text-lg font-medium mb-3">{t(lang, "expenses_all_heading")}</h2>
        <AllExpensesTable expenses={expenses || []} categories={allCategories} lang={lang} />
      </section>
    </div>
  );
}
