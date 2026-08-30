import { createClient } from "@/lib/supabase/server";
import TasksTable from "./TasksTable";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, workspaces(name, is_personal)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Tasks</h1>
      <TasksTable tasks={tasks || []} currentUserId={user.id} />
    </div>
  );
}
