import { createClient } from "@/lib/supabase/server";
import { workspaceLabel, creatorLabel } from "@/lib/displayNames";
import { buildCategoryIndex, categoryPathLabel } from "@/lib/categories";
import ExpenseCategoryCharts from "./ExpenseCategoryCharts";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const byId = buildCategoryIndex(categories || []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Expenses</h1>

      <ExpenseCategoryCharts
        expenses={expenses || []}
        categories={categories || []}
        workspaces={workspaces || []}
        savingsParentId={savingsParent?.id || null}
        initialCustomSavings={customSavings || []}
      />

      <section>
        <h2 className="text-lg font-medium mb-3">All expenses</h2>
        {expenses && expenses.length > 0 ? (
          <div className="bg-stone-parchment rounded-lg border divide-y">
            {expenses.map((e) => (
              <div key={e.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e.description || e.category}</p>
                  <p className="text-sm text-stone-taupe">
                    {(e.category_id && categoryPathLabel(byId, e.category_id)) || e.category || "Uncategorized"} ·{" "}
                    {workspaceLabel(e.workspaces)}
                    {creatorLabel(e, user.id) && ` · Added by ${creatorLabel(e, user.id)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {e.amount != null ? `${e.currency || "USD"} ${e.amount}` : "amount not set"}
                  </p>
                  <p className="text-sm text-stone-taupe">{e.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-taupe">No expenses yet — send one to your bot on Telegram.</p>
        )}
      </section>
    </div>
  );
}
