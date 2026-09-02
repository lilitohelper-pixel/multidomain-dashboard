"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { workspaceLabel } from "@/lib/displayNames";
import { t } from "@/lib/i18n";

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

export default function AddTaskForm({ workspaces, defaultWorkspaceId, lang = "en" }) {
  const router = useRouter();
  const supabase = createClient();

  const [task, setTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId || workspaces[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!task.trim() || !workspaceId) return;

    setSaving(true);
    setErrorMsg("");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("tasks").insert({
      task: task.trim(),
      priority,
      due_date: dueDate || null,
      owner_name: ownerName.trim() || null,
      workspace_id: workspaceId,
      created_by_user_id: user.id,
      source: "manual",
    });
    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setTask("");
    setDueDate("");
    setOwnerName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-wrap items-end gap-3 mb-4">
      <div className="w-full sm:flex-1 sm:min-w-[10rem]">
        <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "tasks_col_task")}</label>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder={t(lang, "tasks_task_placeholder")}
          className="w-full border rounded-md px-3 py-1.5 text-sm"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "tasks_col_owner")}</label>
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder={t(lang, "tasks_unassigned")}
          className="w-full sm:min-w-[8rem] border rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex-1 sm:flex-none">
        <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "tasks_col_due_date")}</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full sm:w-auto border rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex-1 sm:flex-none">
        <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "tasks_col_priority")}</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full sm:w-auto border rounded-md px-2 py-1.5 text-sm"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {t(lang, `priority_${p.toLowerCase()}`)}
            </option>
          ))}
        </select>
      </div>
      {workspaces.length > 1 && (
        <div className="w-full sm:w-auto">
          <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "expenses_workspace_label")}</label>
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="w-full sm:w-auto border rounded-md px-2 py-1.5 text-sm"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {workspaceLabel(w, lang)}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={saving || !task.trim() || !workspaceId}
        className="w-full sm:w-auto bg-[var(--action)] text-[var(--action-text)] text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
      >
        {saving ? t(lang, "tasks_adding") : t(lang, "tasks_add_button")}
      </button>
      {errorMsg && <p className="text-sm text-[var(--holiday-text)] w-full">{errorMsg}</p>}
    </form>
  );
}
