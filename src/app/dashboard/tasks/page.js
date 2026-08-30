import { createClient } from "@/lib/supabase/server";
import TaskRow from "./TaskRow";

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
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No tasks yet — send one to your bot on Telegram.</p>
      )}
    </div>
  );
}
