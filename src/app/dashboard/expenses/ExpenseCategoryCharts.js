"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { topLevelCategory, secondLevelCategory, TOP_LEVEL_CATEGORIES, CATEGORY_COLORS, formatAmount } from "@/lib/categories";
import { useExpenseEditor } from "./useExpenseEditor";
import ExpenseTableRow from "./ExpenseTableRow";
import SavingsCategoriesManager from "./SavingsCategoriesManager";

const VISIBLE_ROWS = 10;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Drill-down subcategory colors, also drawn only from the design palette.
const FALLBACK_COLORS = ["#4A7C59", "#9EBA8B", "#5C4033", "#F4A261", "#E9C46A", "#8FACA3"];

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
        className="text-sm font-medium text-forest-hunter hover:text-forest-deep flex items-center gap-1"
      >
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-stone-parchment border rounded-md shadow-lg z-10 min-w-[10rem] py-1 text-sm">
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
      className={`w-full text-left px-3 py-1.5 hover:bg-stone-linen ${active ? "font-semibold text-forest-hunter" : "text-bark-umber"}`}
    >
      {children}
    </button>
  );
}

export default function ExpenseCategoryCharts({ expenses: initialExpenses, categories, workspaces, savingsParentId, initialCustomSavings }) {
  const { expenses, byId, categoryOptions, updateExpense, updateCategory } = useExpenseEditor(
    initialExpenses,
    categories
  );

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

  // Category is not required here — an expense with no category_id (an old
  // row from before this feature, or one Claude couldn't confidently place)
  // still counts as real spending and gets bucketed under "Other" below,
  // rather than silently vanishing from the chart's total.
  const filtered = useMemo(
    () => expenses.filter((e) => e.amount != null && e.date >= range.start && e.date <= range.end),
    [expenses, range.start, range.end]
  );

  const topLevelData = useMemo(() => {
    const sums = new Map();
    for (const e of filtered) {
      const top = e.category_id ? topLevelCategory(byId, e.category_id) : null;
      const name = top ? top.name : "Other";
      if (name === "Income") continue;
      sums.set(name, (sums.get(name) || 0) + (e.amount || 0));
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
      const top = e.category_id ? topLevelCategory(byId, e.category_id) : null;
      const topName = top ? top.name : "Other";
      if (topName !== selectedCategory) continue;
      const second = e.category_id ? secondLevelCategory(byId, e.category_id) : null;
      const key = second ? second.name : e.category_id ? `${topName} (general)` : "Uncategorized";
      sums.set(key, (sums.get(key) || 0) + (e.amount || 0));
    }
    return [...sums.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered, byId, selectedCategory]);

  const chartData = selectedCategory ? drillDownData : topLevelData;
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, VISIBLE_ROWS),
    [expenses]
  );

  return (
    <section className="space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-stone-parchment rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[30rem]">
            <thead>
              <tr className="bg-forest-deep text-stone-parchment text-left">
                <th className="p-2 font-medium">Expense name</th>
                <th className="p-2 font-medium">Category</th>
                <th className="p-2 font-medium">Date</th>
                <th className="p-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: VISIBLE_ROWS }).map((_, i) => {
                const e = recentExpenses[i];
                if (!e) {
                  return (
                    <tr key={`empty-${i}`} className={i % 2 === 0 ? "bg-stone-linen" : "bg-stone-parchment"}>
                      <td className="p-2">&nbsp;</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                  );
                }
                return (
                  <ExpenseTableRow
                    key={e.id}
                    expense={e}
                    categoryOptions={categoryOptions}
                    byId={byId}
                    onUpdate={updateExpense}
                    onUpdateCategory={updateCategory}
                    rowClassName={i % 2 === 0 ? "bg-stone-linen" : "bg-stone-parchment"}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-stone-parchment rounded-lg border p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-forest-deep">
              {selectedCategory ? `${selectedCategory} — ${periodLabel}` : periodLabel}
            </h3>
            <div className="flex items-center gap-4">
              <Dropdown label="Sort" open={sortOpen} onToggle={() => { setSortOpen((o) => !o); setSettingOpen(false); }}>
                <DropdownItem active={periodMode === "weekly"} onClick={() => { setPeriodMode("weekly"); setSortOpen(false); }}>
                  Weekly
                </DropdownItem>
                <div className="px-3 py-1.5 text-xs text-stone-grey uppercase">Monthly</div>
                {months.map((m) => (
                  <DropdownItem
                    key={`${m.year}-${m.month}`}
                    active={periodMode === "monthly" && selectedMonth.year === m.year && selectedMonth.month === m.month}
                    onClick={() => { setPeriodMode("monthly"); setSelectedMonth(m); setSortOpen(false); }}
                  >
                    {MONTH_NAMES[m.month]} {m.year}
                  </DropdownItem>
                ))}
                <div className="px-3 py-1.5 text-xs text-stone-grey uppercase">Annually</div>
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
            <p className="text-stone-taupe text-sm py-12 text-center">No categorized expenses in this range.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={370}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={132}>
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
        <div className="bg-stone-parchment rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Savings categories</h3>
            <button onClick={() => setShowManageSavings(false)} className="text-sm text-forest-hunter hover:underline">
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
