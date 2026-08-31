import { createClient } from "@/lib/supabase/server";
import { workspaceLabel, creatorLabel } from "@/lib/displayNames";
import { buildCategoryIndex, isIncomeCategory, formatSignedAmount } from "@/lib/categories";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayISO();

  const [{ data: tasks }, { data: events }, { data: expenses }, { data: categories }] = await Promise.all([
    supabase.from("tasks").select("*, workspaces(name, is_personal)").eq("due_date", today).order("priority"),
    supabase.from("calendar_events").select("*, workspaces(name, is_personal)").eq("start_date", today).order("start_time"),
    supabase
      .from("expenses")
      .select("amount, category_id, workspaces(name, is_personal)")
      .gte("date", firstOfMonthISO())
      .lte("date", today),
    supabase.from("expense_categories").select("id, parent_id, name"),
  ]);

  const byId = buildCategoryIndex(categories || []);
  const monthNet = (expenses || []).reduce((sum, e) => {
    const signed = isIncomeCategory(byId, e.category_id) ? e.amount || 0 : -(e.amount || 0);
    return sum + signed;
  }, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Today</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">Tasks due today</h2>
        {tasks && tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-3 flex justify-between">
                <span>{t.task}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {t.priority} · {workspaceLabel(t.workspaces)}
                  {creatorLabel(t, user.id) && ` · ${creatorLabel(t, user.id)}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--text-muted)]">Nothing due today.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Events today</h2>
        {events && events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-3 flex justify-between">
                <span>{e.title}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {e.start_time || "All day"} · {workspaceLabel(e.workspaces)}
                  {creatorLabel(e, user.id) && ` · ${creatorLabel(e, user.id)}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--text-muted)]">No events today.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">This month's net</h2>
        <p className={`text-3xl font-semibold ${monthNet < 0 ? "text-[var(--holiday-text)]" : "text-[var(--positive)]"}`}>
          {formatSignedAmount(Math.abs(monthNet), monthNet >= 0)}
        </p>
      </section>
    </div>
  );
}
