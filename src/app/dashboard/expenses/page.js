import { createClient } from "@/lib/supabase/server";
import { workspaceLabel, creatorLabel } from "@/lib/displayNames";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, workspaces(name, is_personal)")
    .order("date", { ascending: false });

  const byCategory = {};
  for (const e of expenses || []) {
    const key = e.category || "Uncategorized";
    byCategory[key] = (byCategory[key] || 0) + (e.amount || 0);
  }
  const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Expenses</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">By category</h2>
        {Object.keys(byCategory).length > 0 ? (
          <div className="bg-white rounded-lg border divide-y">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div key={category} className="p-3 flex justify-between">
                  <span>{category}</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
              ))}
            <div className="p-3 flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No expenses yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">All expenses</h2>
        {expenses && expenses.length > 0 ? (
          <div className="bg-white rounded-lg border divide-y">
            {expenses.map((e) => (
              <div key={e.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e.description || e.category}</p>
                  <p className="text-sm text-gray-500">
                    {e.category} · {workspaceLabel(e.workspaces)}
                    {creatorLabel(e, user.id) && ` · Added by ${creatorLabel(e, user.id)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {e.amount != null ? `${e.currency || "USD"} ${e.amount}` : "amount not set"}
                  </p>
                  <p className="text-sm text-gray-500">{e.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No expenses yet — send one to your bot on Telegram.</p>
        )}
      </section>
    </div>
  );
}
