"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ALL_COLUMNS = [
  { key: "task", label: "Task" },
  { key: "owner_name", label: "Owner" },
  { key: "assigned_by", label: "Assigned by" },
  { key: "created_at", label: "Date of assignment" },
  { key: "due_date", label: "Due date" },
  { key: "priority", label: "Priority" },
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const STORAGE_KEY = "tasksTableColumns";

function defaultColumnPrefs() {
  return ALL_COLUMNS.map((c) => ({ key: c.key, visible: true }));
}

function loadColumnPrefs() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultColumnPrefs();
    const parsed = JSON.parse(saved);
    const knownKeys = new Set(parsed.map((p) => p.key));
    const merged = parsed.filter((p) => ALL_COLUMNS.some((c) => c.key === p.key));
    for (const col of ALL_COLUMNS) {
      if (!knownKeys.has(col.key)) merged.push({ key: col.key, visible: true });
    }
    return merged;
  } catch {
    return defaultColumnPrefs();
  }
}

export default function TasksTable({ tasks: initialTasks }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState(initialTasks);
  const [columnPrefs, setColumnPrefs] = useState(defaultColumnPrefs);
  const [showCustomize, setShowCustomize] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setColumnPrefs(loadColumnPrefs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columnPrefs));
      } catch {}
    }
  }, [columnPrefs, hydrated]);

  function moveColumn(index, direction) {
    setColumnPrefs((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleVisible(key) {
    setColumnPrefs((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  }

  async function updateField(taskId, field, value) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)));
    const { error } = await supabase.from("tasks").update({ [field]: value }).eq("id", taskId);
    if (error) console.error(`Failed to update ${field}:`, error.message);
  }

  async function toggleDone(task) {
    const newStatus = task.status === "Done" ? "Not started" : "Done";
    await updateField(task.id, "status", newStatus);
  }

  const visibleColumns = columnPrefs
    .filter((c) => c.visible)
    .map((c) => ALL_COLUMNS.find((col) => col.key === c.key))
    .filter(Boolean);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setShowCustomize((s) => !s)} className="text-sm text-blue-600 hover:underline">
          {showCustomize ? "Done customizing" : "Customize columns"}
        </button>
      </div>

      {showCustomize && (
        <div className="mb-4 bg-white rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium mb-2">Columns (check to show, arrows to reorder)</p>
          {columnPrefs.map((c, i) => {
            const col = ALL_COLUMNS.find((col) => col.key === c.key);
            if (!col) return null;
            return (
              <div key={c.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={c.visible} onChange={() => toggleVisible(c.key)} />
                <span className="flex-1">{col.label}</span>
                <button onClick={() => moveColumn(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === columnPrefs.length - 1}
                  className="px-1 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet — send one to your bot on Telegram.</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3 w-8"></th>
                {visibleColumns.map((col) => (
                  <th key={col.key} className="p-3 font-medium whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b last:border-0">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={task.status === "Done"}
                      onChange={() => toggleDone(task)}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="p-3">
                      <TaskCell columnKey={col.key} task={task} onUpdate={updateField} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaskCell({ columnKey, task, onUpdate }) {
  const isDone = task.status === "Done";

  if (columnKey === "task") {
    return (
      <input
        type="text"
        defaultValue={task.task}
        onBlur={(e) => e.target.value !== task.task && onUpdate(task.id, "task", e.target.value)}
        className={`w-full min-w-[10rem] bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 ${
          isDone ? "line-through text-gray-400" : ""
        }`}
      />
    );
  }
  if (columnKey === "owner_name") {
    return (
      <input
        type="text"
        defaultValue={task.owner_name || ""}
        placeholder="(unassigned)"
        onBlur={(e) =>
          e.target.value !== (task.owner_name || "") && onUpdate(task.id, "owner_name", e.target.value || null)
        }
        className="w-full min-w-[8rem] bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1"
      />
    );
  }
  if (columnKey === "assigned_by") {
    return <span className="text-gray-600 whitespace-nowrap">{task.users?.email || task.telegram_first_name || "—"}</span>;
  }
  if (columnKey === "created_at") {
    return <span className="text-gray-600 whitespace-nowrap">{task.created_at.slice(0, 10)}</span>;
  }
  if (columnKey === "due_date") {
    return (
      <input
        type="date"
        defaultValue={task.due_date || ""}
        onChange={(e) => onUpdate(task.id, "due_date", e.target.value || null)}
        className="bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1"
      />
    );
  }
  if (columnKey === "priority") {
    return (
      <select
        defaultValue={task.priority || "Medium"}
        onChange={(e) => onUpdate(task.id, "priority", e.target.value)}
        className="bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1"
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    );
  }
  return null;
}
