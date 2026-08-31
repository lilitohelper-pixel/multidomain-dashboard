import { createClient } from "@/lib/supabase/server";
import SavingsCategoriesManager from "./SavingsCategoriesManager";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: savingsParent } = await supabase
    .from("expense_categories")
    .select("id")
    .is("workspace_id", null)
    .is("parent_id", null)
    .eq("name", "Savings")
    .maybeSingle();

  const [{ data: workspaces }, { data: customCategories }] = await Promise.all([
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Savings categories</h1>
        <p className="text-gray-500 text-sm mt-1">
          Everything else in the expense matrix is fixed, but you can define your own Savings goals here —
          they&apos;ll also be created automatically the first time you mention a new one to the bot.
        </p>
      </div>
      <SavingsCategoriesManager
        initialCategories={customCategories || []}
        workspaces={workspaces || []}
        savingsParentId={savingsParent?.id || null}
      />
    </div>
  );
}
