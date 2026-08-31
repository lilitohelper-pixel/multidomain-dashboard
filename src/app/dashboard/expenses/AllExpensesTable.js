"use client";

import { useMemo, useState } from "react";
import { useExpenseEditor } from "./useExpenseEditor";
import ExpenseTableRow from "./ExpenseTableRow";

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

export default function AllExpensesTable({ expenses: initialExpenses, categories }) {
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
      <div className="bg-stone-parchment rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[32rem]">
          <thead>
            <tr className="bg-forest-deep text-stone-parchment text-left">
              <th className="p-2 font-medium">Expense name</th>
              <th className="p-2 font-medium">Category</th>
              <th className="p-2 font-medium w-36">Date</th>
              <th className="p-2 font-medium w-28">Amount</th>
              <th className="p-2 font-medium w-14">Currency</th>
              <th className="p-2 font-medium w-14"></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-stone-taupe">
                  No expenses yet — send one to your bot on Telegram.
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
                  rowClassName={i % 2 === 0 ? "bg-stone-linen" : "bg-stone-parchment"}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-stone-taupe">Show</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => changePageSize(size)}
              className={`px-2 py-1 rounded-md border ${
                pageSize === size
                  ? "bg-forest-hunter text-stone-parchment border-forest-hunter"
                  : "bg-stone-parchment text-bark-umber"
              }`}
            >
              {size}
            </button>
          ))}
          <span className="text-stone-taupe">rows</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-md text-forest-hunter disabled:text-stone-grey disabled:cursor-not-allowed hover:underline"
            >
              Prev
            </button>
            {pageNumbers(currentPage, totalPages).map((p) =>
              typeof p === "string" ? (
                <span key={p} className="px-1 text-stone-taupe">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded-md ${
                    p === currentPage ? "bg-forest-hunter text-stone-parchment" : "text-forest-hunter hover:underline"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-md text-forest-hunter disabled:text-stone-grey disabled:cursor-not-allowed hover:underline"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
