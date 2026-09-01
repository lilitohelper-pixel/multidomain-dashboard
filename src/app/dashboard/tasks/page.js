import { createClient } from "@/lib/supabase/server";
import TasksTable from "./TasksTable";
import AddTaskForm from "./AddTaskForm";
import { getUserLanguage, t } from "@/lib/i18n";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = await getUserLanguage(supabase, user.id);
  const [{ data: tasks }, { data: workspaces }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, workspaces(name, is_personal)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("workspaces").select("id, name, is_personal"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t(lang, "nav_tasks")}</h1>
      <AddTaskForm workspaces={workspaces || []} lang={lang} />
      <TasksTable tasks={tasks || []} currentUserId={user.id} lang={lang} />
    </div>
  );
}
