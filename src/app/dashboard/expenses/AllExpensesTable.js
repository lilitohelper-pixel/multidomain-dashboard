"use client";

import { useMemo, useState } from "react";
import { useExpenseEditor } from "./useExpenseEditor";
import ExpenseTableRow from "./ExpenseTableRow";
import { t } from "@/lib/i18n";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const withEllipsis = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) withEllipsis.push(`ellipsis-${p}`);
    withEllipsis.push(p);
    prev = p;
  }
  return withEllipsis;
}

export default function AllExpensesTable({ expenses: initialExpenses, categories, lang = "en" }) {
  const { expenses, byId, categoryOptions, updateExpense, updateCategory, deleteExpense } = useExpenseEditor(
    initialExpenses,
    categories
  );
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)), [expenses]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function changePageSize(size) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm min-w-[32rem]">
          <thead>
            <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-text)] text-left">
              <th className="p-2 font-medium">{t(lang, "expenses_col_name")}</th>
              <th className="p-2 font-medium">{t(lang, "expenses_col_category")}</th>
              <th className="p-2 font-medium w-36">{t(lang, "expenses_col_date")}</th>
              <th className="p-2 font-medium w-28">{t(lang, "expenses_col_amount")}</th>
              <th className="p-2 font-medium w-14">{t(lang, "expenses_col_currency")}</th>
              <th className="p-2 font-medium w-14"></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[var(--text-muted)]">
                  {t(lang, "expenses_empty")}
                </td>
              </tr>
            ) : (
              pageRows.map((e, i) => (
                <ExpenseTableRow
                  key={e.id}
                  expense={e}
                  categoryOptions={categoryOptions}
                  byId={byId}
                  onUpdate={updateExpense}
                  onUpdateCategory={updateCategory}
                  onDelete={deleteExpense}
                  rowClassName={i % 2 === 0 ? "bg-[var(--surface-alt)]" : "bg-[var(--surface)]"}
                  lang={lang}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)]">{t(lang, "expenses_show_rows")}</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => changePageSize(size)}
              className={`px-2 py-1 rounded-md border border-[var(--border)] ${
                pageSize === size
                  ? "bg-[var(--action)] text-[var(--action-text)] border-[var(--action)]"
                  : "bg-[var(--surface)] text-[var(--text)]"
              }`}
            >
              {size}
            </button>
          ))}
          <span className="text-[var(--text-muted)]">{t(lang, "expenses_rows_label")}</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-md text-[var(--action)] disabled:text-[var(--text-faint)] disabled:cursor-not-allowed hover:underline"
            >
              {t(lang, "expenses_prev")}
            </button>
            {pageNumbers(currentPage, totalPages).map((p) =>
              typeof p === "string" ? (
                <span key={p} className="px-1 text-[var(--text-muted)]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded-md ${
                    p === currentPage ? "bg-[var(--action)] text-[var(--action-text)]" : "text-[var(--action)] hover:underline"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-md text-[var(--action)] disabled:text-[var(--text-faint)] disabled:cursor-not-allowed hover:underline"
            >
              {t(lang, "expenses_next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
