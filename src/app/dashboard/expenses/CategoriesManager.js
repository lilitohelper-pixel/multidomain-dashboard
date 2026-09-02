"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { workspaceLabel } from "@/lib/displayNames";
import { t, translateCategoryName } from "@/lib/i18n";

export default function CategoriesManager({ initialCategories, topLevelCategories, workspaces, defaultWorkspaceId, lang = "en" }) {
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(topLevelCategories[0]?.id || "");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId || workspaces[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function addCategory(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !workspaceId || !parentId) return;

    setSaving(true);
    setErrorMsg("");
    const { data, error } = await supabase
      .from("expense_categories")
      .insert({ workspace_id: workspaceId, parent_id: parentId, name: trimmed, level: 2, is_system: false })
      .select("id, workspace_id, parent_id, name, workspaces(name, is_personal)")
      .single();
    setSaving(false);

    if (error) {
      setErrorMsg(error.message.toLowerCase().includes("duplicate") ? t(lang, "savings_duplicate") : error.message);
      return;
    }
    setCategories((prev) => [...prev, data]);
    setName("");
  }

  async function deleteCategory(cat) {
    if (!window.confirm(t(lang, "savings_delete_confirm", { name: cat.name }))) return;

    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    const { error } = await supabase.from("expense_categories").delete().eq("id", cat.id);
    if (error) {
      setCategories(previous);
      window.alert(
        error.message.toLowerCase().includes("foreign key")
          ? t(lang, "savings_delete_fk_error")
          : `Failed to delete: ${error.message}`
      );
    }
  }

  const parentNameById = Object.fromEntries(topLevelCategories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <form onSubmit={addCategory} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:flex-1 sm:min-w-[10rem]">
          <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "categories_new_label")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(lang, "categories_new_placeholder")}
            className="w-full border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "categories_parent_label")}</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full sm:w-auto border rounded-md px-2 py-1.5 text-sm"
          >
            {topLevelCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {translateCategoryName(lang, c.name)}
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
          disabled={saving || !name.trim() || !workspaceId || !parentId}
          className="w-full sm:w-auto bg-[var(--action)] text-[var(--action-text)] text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
        >
          {saving ? t(lang, "expenses_adding") : t(lang, "savings_add_button")}
        </button>
      </form>
      {errorMsg && <p className="text-sm text-[var(--holiday-text)]">{errorMsg}</p>}

      {categories.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t(lang, "categories_empty")}</p>
      ) : (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          {categories.map((c) => (
            <div key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <span className="text-[var(--text-muted)]">{translateCategoryName(lang, parentNameById[c.parent_id] || "")}: </span>
                <span>{c.name}</span>
                {workspaces.length > 1 && (
                  <span className="text-sm text-[var(--text-muted)] ml-2">{workspaceLabel(c.workspaces, lang)}</span>
                )}
              </div>
              <button onClick={() => deleteCategory(c)} title={t(lang, "savings_delete_title")} className="text-[var(--text-faint)] hover:text-[var(--holiday-text)]">
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
