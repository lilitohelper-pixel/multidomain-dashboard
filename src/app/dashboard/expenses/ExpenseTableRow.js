"use client";

import { isIncomeCategory, categoryPathLabel } from "@/lib/categories";

export default function ExpenseTableRow({ expense: e, categoryOptions, byId, onUpdate, onUpdateCategory, rowClassName }) {
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
      <td className="p-1">
        <select
          value={e.category_id || ""}
          onChange={(ev) => onUpdateCategory(e.id, ev.target.value)}
          title={currentLabel}
          className="w-full max-w-[11rem] truncate bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1 text-sm"
        >
          {!e.category_id && <option value="">{e.category || "Uncategorized"}</option>}
          {categoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-1">
        <input
          type="date"
          defaultValue={e.date}
          onChange={(ev) => ev.target.value && onUpdate(e.id, { date: ev.target.value })}
          className="bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1"
        />
      </td>
      <td className="p-1">
        <div className="flex items-center gap-1">
          <span
            className={`w-3 shrink-0 text-center ${
              isIncomeCategory(byId, e.category_id) ? "text-forest-hunter" : "text-amber-rust"
            }`}
          >
            {isIncomeCategory(byId, e.category_id) ? "+" : "-"}
          </span>
          <input
            type="number"
            step="0.01"
            defaultValue={e.amount ?? ""}
            onBlur={(ev) => {
              const v = ev.target.value === "" ? null : Number(ev.target.value);
              if (v !== e.amount) onUpdate(e.id, { amount: v });
            }}
            className="w-16 bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-2 py-1"
          />
          <span className="text-stone-taupe text-xs">{e.currency || "USD"}</span>
        </div>
      </td>
    </tr>
  );
}
