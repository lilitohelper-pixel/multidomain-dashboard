import { createClient } from "@/lib/supabase/server";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function TodayPage() {
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: tasks }, { data: events }, { data: expenses }] = await Promise.all([
    supabase.from("tasks").select("*, workspaces(name)").eq("due_date", today).order("priority"),
    supabase.from("calendar_events").select("*, workspaces(name)").eq("start_date", today).order("start_time"),
    supabase.from("expenses").select("amount, workspaces(name)").gte("date", firstOfMonthISO()).lte("date", today),
  ]);

  const monthTotal = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Today</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">Tasks due today</h2>
        {tasks && tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="bg-white rounded-lg border p-3 flex justify-between">
                <span>{t.task}</span>
                <span className="text-sm text-gray-500">
                  {t.priority} · {t.workspaces?.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Nothing due today.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Events today</h2>
        {events && events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="bg-white rounded-lg border p-3 flex justify-between">
                <span>{e.title}</span>
                <span className="text-sm text-gray-500">
                  {e.start_time || "All day"} · {e.workspaces?.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No events today.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">This month's spending</h2>
        <p className="text-3xl font-semibold">${monthTotal.toFixed(2)}</p>
      </section>
    </div>
  );
}
