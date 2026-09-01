"use client";

import { isIncomeCategory, categoryPathLabel, formatAmount } from "@/lib/categories";
import { t } from "@/lib/i18n";

export default function ExpenseTableRow({ expense: e, categoryOptions, byId, onUpdate, onUpdateCategory, onDelete, rowClassName, lang = "en" }) {
  const currentLabel = e.category_id ? categoryPathLabel(byId, e.category_id) : e.category || t(lang, "expenses_uncategorized");

  return (
    <tr className={rowClassName}>
      <td className="p-1">
        <input
          type="text"
          defaultValue={e.description || ""}
          onBlur={(ev) =>
            ev.target.value !== (e.description || "") && onUpdate(e.id, { description: ev.target.value })
          }
          className="w-full min-w-[7rem] bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-2 py-1"
        />
      </td>
      <td className="p-1 w-80">
        <select
          value={e.category_id || ""}
          onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
          title={currentLabel}
          className="w-full max-w-[19.25rem] truncate bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-2 py-1 text-sm"
        >
          {!e.category_id && <option value="">{e.category || t(lang, "expenses_uncategorized")}</option>}
          {categoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-1 w-36">
        <input
          type="date"
          defaultValue={e.date}
          onChange={(ev) => ev.target.value && onUpdate(e.id, { date: ev.target.value })}
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-2 py-1"
        />
      </td>
      <td className="p-1 w-28">
        <div className="flex items-center gap-1">
          <span
            className={`w-3 shrink-0 text-center ${
              isIncomeCategory(byId, e.category_id) ? "text-[var(--positive)]" : "text-[var(--holiday-text)]"
            }`}
          >
            {isIncomeCategory(byId, e.category_id) ? "+" : "-"}
          </span>
          <input
            type="text"
            inputMode="decimal"
            defaultValue={e.amount != null ? formatAmount(e.amount) : ""}
            onBlur={(ev) => {
              const cleaned = ev.target.value.replace(/\s/g, "").replace(",", ".");
              const v = cleaned === "" ? null : Number(cleaned);
              if (!Number.isNaN(v) && v !== e.amount) onUpdate(e.id, { amount: v });
              ev.target.value = v != null && !Number.isNaN(v) ? formatAmount(v) : "";
            }}
            className="w-full min-w-0 bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-2 py-1"
          />
        </div>
      </td>
      <td className="p-1 w-14 text-center">
        <span className="text-[var(--text-muted)] text-xs">{e.currency || "USD"}</span>
      </td>
      <td className="p-1 w-14 text-center">
        <button
          onClick={() => {
            if (window.confirm(t(lang, "expenses_delete_confirm", { name: e.description || t(lang, "expenses_title") }))) onDelete(e.id);
          }}
          title={t(lang, "expenses_delete_title")}
          className="text-[var(--text-faint)] hover:text-[var(--holiday-text)]"
        >
          🗑
        </button>
      </td>
    </tr>
  );
}
