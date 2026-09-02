"use client";

import { useState } from "react";
import { workspaceLabel } from "@/lib/displayNames";
import { t } from "@/lib/i18n";

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AddExpenseForm({ categoryOptions, workspaces, defaultWorkspaceId, onAdd, lang = "en" }) {
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId || workspaces[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim() || amount === "" || !workspaceId) return;

    setSaving(true);
    setErrorMsg("");
    const { error } = await onAdd({
      description: description.trim(),
      categoryId: categoryId || null,
      date,
      amount: Number(amount),
      currency: currency.trim().toUpperCase() || "USD",
      workspaceId,
    });
    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setDescription("");
    setCategoryId("");
    setAmount("");
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-wrap items-end gap-3 mb-4">
      <div className="w-full sm:flex-1 sm:min-w-[8rem]">
        <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "expenses_description_label")}</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t(lang, "expenses_description_placeholder")}
          className="w-full border rounded-md px-3 py-1.5 text-sm"
        />
      </div>
      <div className="w-full sm:w-auto sm:min-w-[9rem]">
        <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "expenses_category_label")}</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full sm:max-w-[11rem] truncate border rounded-md px-2 py-1.5 text-sm"
        >
          <option value="">{t(lang, "expenses_uncategorized")}</option>
          {categoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-auto">
          <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "expenses_date_label")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-auto border rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 sm:flex-none sm:w-20">
            <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "expenses_amount_label")}</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 sm:flex-none sm:w-16">
            <label className="block text-sm text-[var(--text-muted)] mb-1">{t(lang, "expenses_currency_label")}</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              className="w-full border rounded-md px-2 py-1.5 text-sm uppercase"
            />
          </div>
        </div>
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
        disabled={saving || !description.trim() || amount === "" || !workspaceId}
        className="w-full sm:w-auto bg-[var(--action)] text-[var(--action-text)] text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
      >
        {saving ? t(lang, "expenses_adding") : t(lang, "expenses_add_button")}
      </button>
      {errorMsg && <p className="text-sm text-[var(--holiday-text)] w-full">{errorMsg}</p>}
    </form>
  );
}
