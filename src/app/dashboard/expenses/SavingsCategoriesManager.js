"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { workspaceLabel } from "@/lib/displayNames";

export default function SavingsCategoriesManager({ initialCategories, workspaces, savingsParentId }) {
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function addCategory(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !workspaceId || !savingsParentId) return;

    setSaving(true);
    setErrorMsg("");
    const { data, error } = await supabase
      .from("expense_categories")
      .insert({ workspace_id: workspaceId, parent_id: savingsParentId, name: trimmed, level: 2, is_system: false })
      .select("id, workspace_id, name, workspaces(name, is_personal)")
      .single();
    setSaving(false);

    if (error) {
      setErrorMsg(
        error.message.toLowerCase().includes("duplicate") ? "That category already exists." : error.message
      );
      return;
    }
    setCategories((prev) => [...prev, data]);
    setName("");
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;

    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    const { error } = await supabase.from("expense_categories").delete().eq("id", cat.id);
    if (error) {
      setCategories(previous);
      window.alert(
        error.message.toLowerCase().includes("foreign key")
          ? "Can't delete — this category already has expenses assigned to it."
          : `Failed to delete: ${error.message}`
      );
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addCategory} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-sm text-[var(--text-muted)] mb-1">New Savings goal</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New car, Emergency fund"
            className="w-full border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        {workspaces.length > 1 && (
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">Workspace</label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {workspaceLabel(w)}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={saving || !name.trim() || !workspaceId}
          className="bg-[var(--action)] text-[var(--action-text)] text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </form>
      {errorMsg && <p className="text-sm text-[var(--holiday-text)]">{errorMsg}</p>}

      {categories.length === 0 ? (
        <p className="text-[var(--text-muted)]">No custom Savings categories yet.</p>
      ) : (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          {categories.map((c) => (
            <div key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <span>{c.name}</span>
                {workspaces.length > 1 && (
                  <span className="text-sm text-[var(--text-muted)] ml-2">{workspaceLabel(c.workspaces)}</span>
                )}
              </div>
              <button onClick={() => deleteCategory(c)} title="Delete category" className="text-[var(--text-faint)] hover:text-[var(--holiday-text)]">
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
