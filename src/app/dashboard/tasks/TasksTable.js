"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { creatorLabel } from "@/lib/displayNames";
import { t } from "@/lib/i18n";

const COLUMN_KEYS = [
  { key: "task", labelKey: "tasks_col_task", sortable: true },
  { key: "owner_name", labelKey: "tasks_col_owner", sortable: true },
  { key: "assigned_by", labelKey: "tasks_col_assigned_by", sortable: true },
  { key: "created_at", labelKey: "tasks_col_date_assigned", sortable: true },
  { key: "due_date", labelKey: "tasks_col_due_date", sortable: true },
  { key: "priority", labelKey: "tasks_col_priority", sortable: true },
  { key: "reminder_enabled", labelKey: "tasks_col_reminder", sortable: false },
];

// Stored values stay in English (Claude's classification and the DB both use
// these literally) — only the displayed label is translated per column below.
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const PRIORITY_ORDER = { Low: 0, Medium: 1, High: 2 };
const STORAGE_KEY = "tasksTableColumns";

function allColumns(lang) {
  return COLUMN_KEYS.map((c) => ({ key: c.key, sortable: c.sortable, label: t(lang, c.labelKey) }));
}

function defaultColumnPrefs() {
  return COLUMN_KEYS.map((c) => ({ key: c.key, visible: true }));
}

function loadColumnPrefs() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultColumnPrefs();
    const parsed = JSON.parse(saved);
    const knownKeys = new Set(parsed.map((p) => p.key));
    const merged = parsed.filter((p) => COLUMN_KEYS.some((c) => c.key === p.key));
    for (const col of COLUMN_KEYS) {
      if (!knownKeys.has(col.key)) merged.push({ key: col.key, visible: true });
    }
    return merged;
  } catch {
    return defaultColumnPrefs();
  }
}

function sortValue(task, key, currentUserId) {
  if (key === "assigned_by") return creatorLabel(task, currentUserId).toLowerCase();
  if (key === "owner_name") return (task.owner_name || "").toLowerCase();
  if (key === "priority") return PRIORITY_ORDER[task.priority] ?? -1;
  if (key === "due_date") return task.due_date || "9999-99-99";
  if (key === "created_at") return task.created_at;
  return (task[key] || "").toString().toLowerCase();
}

export default function TasksTable({ tasks: initialTasks, currentUserId, lang = "en" }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState(initialTasks);
  const [columnPrefs, setColumnPrefs] = useState(defaultColumnPrefs);
  const [showCustomize, setShowCustomize] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOwner, setFilterOwner] = useState("All");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortDir, setSortDir] = useState("asc");

  const ALL_COLUMNS = useMemo(() => allColumns(lang), [lang]);
  const unassignedLabel = t(lang, "tasks_unassigned");

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

  async function deleteTask(task) {
    if (!window.confirm(t(lang, "tasks_delete_confirm", { task: task.task }))) return;

    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      console.error("Failed to delete task:", error.message);
      setTasks(previous);
    }
  }

  function toggleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  const ownerOptions = useMemo(() => {
    const names = new Set();
    let hasUnassigned = false;
    for (const t of tasks) {
      if (t.owner_name) names.add(t.owner_name);
      else hasUnassigned = true;
    }
    return [...names].sort().concat(hasUnassigned ? [unassignedLabel] : []);
  }, [tasks, unassignedLabel]);

  const visibleTasks = useMemo(() => {
    let result = tasks;

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((t) => t.task.toLowerCase().includes(q));
    }
    if (filterPriority !== "All") {
      result = result.filter((t) => t.priority === filterPriority);
    }
    if (filterStatus !== "All") {
      result = result.filter((t) => t.status === filterStatus);
    }
    if (filterOwner !== "All") {
      result = result.filter((t) => (filterOwner === unassignedLabel ? !t.owner_name : t.owner_name === filterOwner));
    }

    result = [...result].sort((a, b) => {
      const av = sortValue(a, sortBy, currentUserId);
      const bv = sortValue(b, sortBy, currentUserId);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, searchText, filterPriority, filterStatus, filterOwner, sortBy, sortDir, currentUserId, unassignedLabel]);

  const visibleColumns = columnPrefs
    .filter((c) => c.visible)
    .map((c) => ALL_COLUMNS.find((col) => col.key === c.key))
    .filter(Boolean);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t(lang, "tasks_search_placeholder")}
          className="border rounded-md px-3 py-1.5 text-sm flex-1 min-w-[10rem]"
        />
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm">
          <option value="All">{t(lang, "tasks_all_priorities")}</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{t(lang, `priority_${p.toLowerCase()}`)}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm">
          <option value="All">{t(lang, "tasks_all_statuses")}</option>
          <option value="Not started">{t(lang, "tasks_status_not_started")}</option>
          <option value="Done">{t(lang, "tasks_status_done")}</option>
        </select>
        <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm">
          <option value="All">{t(lang, "tasks_all_owners")}</option>
          {ownerOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <button onClick={() => setShowCustomize((s) => !s)} className="text-sm text-[var(--action)] hover:underline ml-auto">
          {showCustomize ? t(lang, "tasks_done_customizing") : t(lang, "tasks_customize_columns")}
        </button>
      </div>

      {showCustomize && (
        <div className="mb-4 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 space-y-2">
          <p className="text-sm font-medium mb-2">{t(lang, "tasks_customize_hint")}</p>
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

      {visibleTasks.length === 0 ? (
        <p className="text-[var(--text-muted)]">
          {tasks.length === 0 ? t(lang, "tasks_empty_none") : t(lang, "tasks_empty_filtered")}
        </p>
      ) : (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="p-3 w-8"></th>
                {visibleColumns.map((col) => (
                  <th key={col.key} className="p-3 font-medium whitespace-nowrap">
                    {col.sortable ? (
                      <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-[var(--text)]">
                        {col.label}
                        {sortBy === col.key && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                <th className="p-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => (
                <tr key={task.id} className="border-b border-[var(--border)] last:border-0">
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
                      <TaskCell columnKey={col.key} task={task} onUpdate={updateField} currentUserId={currentUserId} lang={lang} />
                    </td>
                  ))}
                  <td className="p-3">
                    <button
                      onClick={() => deleteTask(task)}
                      title={t(lang, "tasks_delete_title")}
                      className="text-[var(--text-faint)] hover:text-[var(--holiday-text)]"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaskCell({ columnKey, task, onUpdate, currentUserId, lang }) {
  const isDone = task.status === "Done";

  if (columnKey === "task") {
    return (
      <input
        type="text"
        defaultValue={task.task}
        onBlur={(e) => e.target.value !== task.task && onUpdate(task.id, "task", e.target.value)}
        className={`w-full min-w-[10rem] bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-1 ${
          isDone ? "line-through text-[var(--text-faint)]" : ""
        }`}
      />
    );
  }
  if (columnKey === "owner_name") {
    return (
      <input
        type="text"
        defaultValue={task.owner_name || ""}
        placeholder={t(lang, "tasks_unassigned")}
        onBlur={(e) =>
          e.target.value !== (task.owner_name || "") && onUpdate(task.id, "owner_name", e.target.value || null)
        }
        className="w-full min-w-[8rem] bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-1"
      />
    );
  }
  if (columnKey === "assigned_by") {
    return <span className="text-[var(--text-muted)] whitespace-nowrap">{creatorLabel(task, currentUserId)}</span>;
  }
  if (columnKey === "created_at") {
    return <span className="text-[var(--text-muted)] whitespace-nowrap">{task.created_at.slice(0, 10)}</span>;
  }
  if (columnKey === "due_date") {
    return (
      <input
        type="date"
        defaultValue={task.due_date || ""}
        onChange={(e) => onUpdate(task.id, "due_date", e.target.value || null)}
        className="bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-1"
      />
    );
  }
  if (columnKey === "priority") {
    const priorityTextVar = isDone
      ? "--pri-done-text"
      : task.priority === "High"
        ? "--pri-high-text"
        : task.priority === "Low"
          ? "--pri-low-text"
          : "--pri-med-text";
    return (
      <select
        defaultValue={task.priority || "Medium"}
        onChange={(e) => onUpdate(task.id, "priority", e.target.value)}
        style={{ color: `var(${priorityTextVar})` }}
        className="bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-1 font-medium"
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {t(lang, `priority_${p.toLowerCase()}`)}
          </option>
        ))}
      </select>
    );
  }
  if (columnKey === "reminder_enabled") {
    return (
      <input
        type="checkbox"
        checked={task.reminder_enabled}
        onChange={(e) => onUpdate(task.id, "reminder_enabled", e.target.checked)}
        title="Send a Telegram reminder on the due date"
        className="h-4 w-4 cursor-pointer"
      />
    );
  }
  return null;
}
