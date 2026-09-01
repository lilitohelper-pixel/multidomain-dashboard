import { createClient } from "@/lib/supabase/server";
import TasksTable from "./TasksTable";
import AddTaskForm from "./AddTaskForm";
import { getUserLanguage, t } from "@/lib/i18n";
import { getUserWorkspaces, getActiveWorkspaceId } from "@/lib/workspace";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = await getUserLanguage(supabase, user.id);
  const workspaces = await getUserWorkspaces(supabase, user.id);
  const activeWorkspaceId = await getActiveWorkspaceId(supabase, user.id, workspaces);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, workspaces(name, is_personal)")
    .eq("workspace_id", activeWorkspaceId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t(lang, "nav_tasks")}</h1>
      <AddTaskForm workspaces={workspaces} defaultWorkspaceId={activeWorkspaceId} lang={lang} />
      <TasksTable tasks={tasks || []} currentUserId={user.id} lang={lang} />
    </div>
  );
}
