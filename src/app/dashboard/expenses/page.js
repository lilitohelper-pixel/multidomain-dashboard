import { createClient } from "@/lib/supabase/server";
import ExpenseCategoryCharts from "./ExpenseCategoryCharts";
import AllExpensesTable from "./AllExpensesTable";
import { getUserLanguage, t } from "@/lib/i18n";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = await getUserLanguage(supabase, user.id);
  const { data: savingsParent } = await supabase
    .from("expense_categories")
    .select("id")
    .is("workspace_id", null)
    .is("parent_id", null)
    .eq("name", "Savings")
    .maybeSingle();

  const [{ data: expenses }, { data: categories }, { data: workspaces }, { data: customSavings }] = await Promise.all([
    supabase.from("expenses").select("*, workspaces(name, is_personal)").order("date", { ascending: false }),
    supabase.from("expense_categories").select("id, parent_id, name"),
    supabase.from("workspaces").select("id, name, is_personal"),
    savingsParent
      ? supabase
          .from("expense_categories")
          .select("id, workspace_id, name, workspaces(name, is_personal)")
          .eq("parent_id", savingsParent.id)
          .not("workspace_id", "is", null)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">{t(lang, "expenses_title")}</h1>

      <ExpenseCategoryCharts
        expenses={expenses || []}
        categories={categories || []}
        workspaces={workspaces || []}
        savingsParentId={savingsParent?.id || null}
        initialCustomSavings={customSavings || []}
        currentUserId={user.id}
        lang={lang}
      />

      <section>
        <h2 className="text-lg font-medium mb-3">{t(lang, "expenses_all_heading")}</h2>
        <AllExpensesTable expenses={expenses || []} categories={categories || []} lang={lang} />
      </section>
    </div>
  );
}
