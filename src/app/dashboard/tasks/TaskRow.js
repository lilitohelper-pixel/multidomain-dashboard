"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TaskRow({ task }) {
  const supabase = createClient();
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);

  async function toggleDone() {
    const newStatus = status === "Done" ? "Not started" : "Done";
    setStatus(newStatus);
    setSaving(true);

    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (error) {
      console.error("Failed to update task:", error.message);
      setStatus(status);
    }
    setSaving(false);
  }

  const isDone = status === "Done";

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isDone}
          onChange={toggleDone}
          disabled={saving}
          className="mt-1 h-4 w-4 cursor-pointer"
        />
        <div>
          <p className={`font-medium ${isDone ? "line-through text-gray-400" : ""}`}>{task.task}</p>
          <p className="text-sm text-gray-500">
            {status} · {task.priority} · {task.workspaces?.name}
          </p>
        </div>
      </div>
      <span className="text-sm text-gray-500">{task.due_date || "no due date"}</span>
    </div>
  );
}
