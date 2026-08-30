import { createClient } from "@/lib/supabase/server";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, workspaces(name)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Tasks</h1>
      {tasks && tasks.length > 0 ? (
        <div className="bg-white rounded-lg border divide-y">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.task}</p>
                <p className="text-sm text-gray-500">
                  {t.status} · {t.priority} · {t.workspaces?.name}
                </p>
              </div>
              <span className="text-sm text-gray-500">{t.due_date || "no due date"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No tasks yet — send one to your bot on Telegram.</p>
      )}
    </div>
  );
}
