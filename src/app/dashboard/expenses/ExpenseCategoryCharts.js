"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import {
  buildCategoryIndex,
  topLevelCategory,
  secondLevelCategory,
  categoryPathLabel,
  TOP_LEVEL_CATEGORIES,
  CATEGORY_COLORS,
  formatAmount,
} from "@/lib/categories";
import SavingsCategoriesManager from "./SavingsCategoriesManager";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FALLBACK_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#7c3aed", "#db2777"];

// All date math below stays in local calendar components (getFullYear/getMonth/getDate,
// or manual string parsing) rather than Date -> toISOString(), which converts to UTC and
// silently shifts the date backward for any timezone ahead of UTC (e.g. Budapest, UTC+2) —
// that off-by-one previously made the last day of a month fall outside its own range.
function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymd(year, month0, day) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function parseYMD(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month0: month - 1, day };
}

function startOfWeekMonday(now) {
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
}

function weekRange() {
  const start = startOfWeekMonday(new Date());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return {
    start: ymd(start.getFullYear(), start.getMonth(), start.getDate()),
    end: ymd(end.getFullYear(), end.getMonth(), end.getDate()),
  };
}

function monthRange(year, monthIndex0) {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return { start: ymd(year, monthIndex0, 1), end: ymd(year, monthIndex0, lastDay) };
}

function yearRange(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function formatShortDate(iso) {
  const { month0, day } = parseYMD(iso);
  return `${MONTH_NAMES[month0].slice(0, 3)} ${day}`;
}

function earliestDate(expenses) {
  if (!expenses.length) {
    const now = new Date();
    return ymd(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date);
}

function listMonthsSince(earliestISO) {
  const now = new Date();
  const { year: endY, month0: endM } = parseYMD(earliestISO);
  const months = [];
  let y = now.getFullYear();
  let m = now.getMonth();
  while (y > endY || (y === endY && m >= endM)) {
    months.push({ year: y, month: m });
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return months;
}

function listYearsSince(earliestISO) {
  const now = new Date();
  const startYear = parseYMD(earliestISO).year;
  const years = [];
  for (let y = now.getFullYear(); y >= startYear; y -= 1) years.push(y);
  return years;
}

function Dropdown({ label, children, open, onToggle }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center gap-1"
      >
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[10rem] py-1 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 ${active ? "font-semibold text-blue-600" : "text-gray-700"}`}
    >
      {children}
    </button>
  );
}

export default function ExpenseCategoryCharts({ expenses: initialExpenses, categories, workspaces, savingsParentId, initialCustomSavings }) {
  const router = useRouter();
  const supabase = createClient();
  const byId = useMemo(() => buildCategoryIndex(categories), [categories]);
  const [expenses, setExpenses] = useState(initialExpenses);
  useEffect(() => setExpenses(initialExpenses), [initialExpenses]);

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => topLevelCategory(byId, c.id)?.name !== "Income")
      .map((c) => ({ id: c.id, label: categoryPathLabel(byId, c.id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, byId]);

  async function updateExpense(id, changes) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    const { error } = await supabase.from("expenses").update(changes).eq("id", id);
    if (error) console.error("Failed to update expense:", error.message);
    router.refresh();
  }

  function updateCategory(id, categoryId) {
    updateExpense(id, { category_id: categoryId, category: categoryPathLabel(byId, categoryId) });
  }

  const earliestISO = useMemo(() => earliestDate(expenses), [expenses]);
  const months = useMemo(() => listMonthsSince(earliestISO), [earliestISO]);
  const years = useMemo(() => listYearsSince(earliestISO), [earliestISO]);

  const now = new Date();
  const [periodMode, setPeriodMode] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [showManageSavings, setShowManageSavings] = useState(false);

  const range = useMemo(() => {
    if (periodMode === "weekly") return weekRange();
    if (periodMode === "annual") return yearRange(selectedYear);
    return monthRange(selectedMonth.year, selectedMonth.month);
  }, [periodMode, selectedMonth, selectedYear]);

  const periodLabel = useMemo(() => {
    if (periodMode === "weekly") {
      return `Week of ${formatShortDate(range.start)} – ${formatShortDate(range.end)}, ${parseYMD(range.end).year}`;
    }
    if (periodMode === "annual") return `${selectedYear}`;
    return `${MONTH_NAMES[selectedMonth.month]} ${selectedMonth.year}`;
  }, [periodMode, range, selectedMonth, selectedYear]);

  const filtered = useMemo(
    () => expenses.filter((e) => e.category_id && e.date >= range.start && e.date <= range.end),
    [expenses, range.start, range.end]
  );

  const topLevelData = useMemo(() => {
    const sums = new Map();
    for (const e of filtered) {
      const top = topLevelCategory(byId, e.category_id);
      if (!top || top.name === "Income") continue;
      sums.set(top.name, (sums.get(top.name) || 0) + (e.amount || 0));
    }
    return TOP_LEVEL_CATEGORIES.filter((name) => sums.get(name) > 0).map((name) => ({
      name,
      value: sums.get(name),
    }));
  }, [filtered, byId]);

  const drillDownData = useMemo(() => {
    if (!selectedCategory) return [];
    const sums = new Map();
    for (const e of filtered) {
      const top = topLevelCategory(byId, e.category_id);
      if (!top || top.name !== selectedCategory) continue;
      const second = secondLevelCategory(byId, e.category_id);
      const key = second ? second.name : `${top.name} (general)`;
      sums.set(key, (sums.get(key) || 0) + (e.amount || 0));
    }
    return [...sums.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered, byId, selectedCategory]);

  const chartData = selectedCategory ? drillDownData : topLevelData;
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  const last10 = useMemo(() => [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10), [expenses]);

  return (
    <section className="space-y-4">
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white text-left">
                <th className="p-3 font-medium">Expense name</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => {
                const e = last10[i];
                if (!e) {
                  return (
                    <tr key={`empty-${i}`} className={i % 2 === 0 ? "bg-green-50" : "bg-white"}>
                      <td className="p-3">&nbsp;</td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                    </tr>
                  );
                }
                return (
                  <tr key={e.id} className={i % 2 === 0 ? "bg-green-50" : "bg-white"}>
                    <td className="p-1">
                      <input
                        type="text"
                        defaultValue={e.description || ""}
                        onBlur={(ev) =>
                          ev.target.value !== (e.description || "") && updateExpense(e.id, { description: ev.target.value })
                        }
                        className="w-full min-w-[8rem] bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-2 py-2"
                      />
                    </td>
                    <td className="p-1">
                      <select
                        value={e.category_id || ""}
                        onChange={(ev) => updateCategory(e.id, ev.target.value)}
                        className="w-full min-w-[9rem] bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-2 py-2 text-sm"
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
                        onChange={(ev) => ev.target.value && updateExpense(e.id, { date: ev.target.value })}
                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-2 py-2"
                      />
                    </td>
                    <td className="p-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={e.amount ?? ""}
                          onBlur={(ev) => {
                            const v = ev.target.value === "" ? null : Number(ev.target.value);
                            if (v !== e.amount) updateExpense(e.id, { amount: v });
                          }}
                          className="w-20 bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-2 py-2"
                        />
                        <span className="text-gray-500">{e.currency || "USD"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-green-800">
              {selectedCategory ? `${selectedCategory} — ${periodLabel}` : periodLabel}
            </h3>
            <div className="flex items-center gap-4">
              <Dropdown label="Sort" open={sortOpen} onToggle={() => { setSortOpen((o) => !o); setSettingOpen(false); }}>
                <DropdownItem active={periodMode === "weekly"} onClick={() => { setPeriodMode("weekly"); setSortOpen(false); }}>
                  Weekly
                </DropdownItem>
                <div className="px-3 py-1.5 text-xs text-gray-400 uppercase">Monthly</div>
                {months.map((m) => (
                  <DropdownItem
                    key={`${m.year}-${m.month}`}
                    active={periodMode === "monthly" && selectedMonth.year === m.year && selectedMonth.month === m.month}
                    onClick={() => { setPeriodMode("monthly"); setSelectedMonth(m); setSortOpen(false); }}
                  >
                    {MONTH_NAMES[m.month]} {m.year}
                  </DropdownItem>
                ))}
                <div className="px-3 py-1.5 text-xs text-gray-400 uppercase">Annually</div>
                {years.map((y) => (
                  <DropdownItem
                    key={y}
                    active={periodMode === "annual" && selectedYear === y}
                    onClick={() => { setPeriodMode("annual"); setSelectedYear(y); setSortOpen(false); }}
                  >
                    {y}
                  </DropdownItem>
                ))}
              </Dropdown>

              <Dropdown label="Setting" open={settingOpen} onToggle={() => { setSettingOpen((o) => !o); setSortOpen(false); }}>
                <DropdownItem active={!selectedCategory} onClick={() => { setSelectedCategory(null); setSettingOpen(false); }}>
                  All categories
                </DropdownItem>
                {TOP_LEVEL_CATEGORIES.map((name) => (
                  <DropdownItem
                    key={name}
                    active={selectedCategory === name}
                    onClick={() => { setSelectedCategory(name); setSettingOpen(false); }}
                  >
                    {name}
                  </DropdownItem>
                ))}
                <div className="border-t my-1" />
                <DropdownItem onClick={() => { setShowManageSavings((s) => !s); setSettingOpen(false); }}>
                  Manage Savings categories...
                </DropdownItem>
              </Dropdown>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="text-gray-500 text-sm py-12 text-center">No categorized expenses in this range.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={selectedCategory ? FALLBACK_COLORS[i % FALLBACK_COLORS.length] : CATEGORY_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${formatAmount(value)} (${((value / chartTotal) * 100).toFixed(0)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2 text-sm">
                {(selectedCategory ? chartData : TOP_LEVEL_CATEGORIES.map((name) => ({ name }))).map((entry) => (
                  <span key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{
                        background: selectedCategory
                          ? FALLBACK_COLORS[chartData.findIndex((d) => d.name === entry.name) % FALLBACK_COLORS.length]
                          : CATEGORY_COLORS[entry.name],
                      }}
                    />
                    {entry.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showManageSavings && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Savings categories</h3>
            <button onClick={() => setShowManageSavings(false)} className="text-sm text-blue-600 hover:underline">
              Close
            </button>
          </div>
          <SavingsCategoriesManager
            initialCategories={initialCustomSavings}
            workspaces={workspaces}
            savingsParentId={savingsParentId}
          />
        </div>
      )}
    </section>
  );
}
