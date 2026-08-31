"use client";

import { isIncomeCategory, categoryPathLabel, formatAmount } from "@/lib/categories";

export default function ExpenseTableRow({ expense: e, categoryOptions, byId, onUpdate, onUpdateCategory, onDelete, rowClassName }) {
  const currentLabel = e.category_id ? categoryPathLabel(byId, e.category_id) : e.category || "Uncategorized";

  return (
    <tr className={rowClassName}>
      <td className="p-1">
        <input
          type="text"
          defaultValue={e.description || ""}
          onBlur={(ev) =>
            ev.target.value !== (e.description || "") && onUpdate(e.id, { description: ev.target.value })
          }
          className="w-full min-w-[7rem] bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1"
        />
      </td>
      <td className="p-1 w-64">
        <select
          value={e.category_id || ""}
          onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
          title={currentLabel}
          className="w-full max-w-[15.4rem] truncate bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1 text-sm"
        >
          {!e.category_id && <option value="">{e.category || "Uncategorized"}</option>}
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
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1"
        />
      </td>
      <td className="p-1 w-28">
        <div className="flex items-center gap-1">
          <span
            className={`w-3 shrink-0 text-center ${
              isIncomeCategory(byId, e.category_id) ? "text-forest-hunter" : "text-amber-rust"
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
            className="w-full min-w-0 bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1"
          />
        </div>
      </td>
      <td className="p-1 w-14 text-center">
        <span className="text-stone-taupe text-xs">{e.currency || "USD"}</span>
      </td>
      <td className="p-1 w-14 text-center">
        <button
          onClick={() => {
            if (window.confirm(`Delete "${e.description || "this expense"}"? This can't be undone.`)) onDelete(e.id);
          }}
          title="Delete expense"
          className="text-stone-grey hover:text-amber-rust"
        >
          🗑
        </button>
      </td>
    </tr>
  );
}
