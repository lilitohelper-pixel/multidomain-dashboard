"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { buildCategoryIndex, topLevelCategory, secondLevelCategory } from "@/lib/categories";

const COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#7c3aed", "#db2777",
  "#0891b2", "#ea580c", "#4d7c0f", "#9333ea", "#0d9488", "#be123c",
];

function presetRange(preset) {
  const now = new Date();
  if (preset === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
  }
  if (preset === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  return { start: "0000-01-01", end: "9999-12-31" };
}

const PRESETS = [
  ["thisMonth", "This month"],
  ["lastMonth", "Last month"],
  ["allTime", "All time"],
  ["custom", "Custom"],
];

export default function ExpenseCategoryCharts({ expenses, categories }) {
  const byId = useMemo(() => buildCategoryIndex(categories), [categories]);
  const [preset, setPreset] = useState("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [drillDown, setDrillDown] = useState(null);

  const range =
    preset === "custom"
      ? { start: customStart || "0000-01-01", end: customEnd || "9999-12-31" }
      : presetRange(preset);

  const filtered = useMemo(
    () => expenses.filter((e) => e.category_id && e.date >= range.start && e.date <= range.end),
    [expenses, range.start, range.end]
  );

  const topLevelData = useMemo(() => {
    const sums = new Map();
    for (const e of filtered) {
      const top = topLevelCategory(byId, e.category_id);
      if (!top || top.name === "Income") continue;
      sums.set(top.id, (sums.get(top.id) || 0) + (e.amount || 0));
    }
    return [...sums.entries()]
      .map(([id, value]) => ({ id, name: byId.get(id).name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, byId]);

  const drillDownData = useMemo(() => {
    if (!drillDown) return [];
    const sums = new Map();
    for (const e of filtered) {
      const top = topLevelCategory(byId, e.category_id);
      if (!top || top.id !== drillDown) continue;
      const second = secondLevelCategory(byId, e.category_id);
      const key = second ? second.id : "__direct__";
      const label = second ? second.name : `${top.name} (general)`;
      const existing = sums.get(key);
      sums.set(key, { name: label, value: (existing ? existing.value : 0) + (e.amount || 0) });
    }
    return [...sums.values()].sort((a, b) => b.value - a.value);
  }, [filtered, byId, drillDown]);

  const topLevelTotal = topLevelData.reduce((s, d) => s + d.value, 0);
  const drillDownTotal = drillDownData.reduce((s, d) => s + d.value, 0);
  const drillDownName = drillDown ? byId.get(drillDown)?.name : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-medium mr-2">Spending by category</h2>
        {PRESETS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`text-sm px-3 py-1 rounded-full border ${
              preset === key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <span>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      {topLevelData.length === 0 ? (
        <p className="text-gray-500">No categorized expenses in this range.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm font-medium mb-2">
              By category — click a slice to drill in (${topLevelTotal.toFixed(2)} total)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={topLevelData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  onClick={(entry) => setDrillDown(entry.id)}
                  cursor="pointer"
                >
                  {topLevelData.map((entry, i) => (
                    <Cell key={entry.id} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `$${value.toFixed(2)} (${((value / topLevelTotal) * 100).toFixed(0)}%)`,
                    name,
                  ]}
                />
                <Legend formatter={(value, entry) => `${value} — $${entry.payload.value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border p-4">
            {drillDown ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {drillDownName} breakdown (${drillDownTotal.toFixed(2)})
                  </p>
                  <button onClick={() => setDrillDown(null)} className="text-sm text-blue-600 hover:underline">
                    ← Back
                  </button>
                </div>
                {drillDownData.length === 0 ? (
                  <p className="text-gray-500 text-sm">No subcategory data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={drillDownData} dataKey="value" nameKey="name" outerRadius={100}>
                        {drillDownData.map((entry, i) => (
                          <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `$${value.toFixed(2)} (${((value / drillDownTotal) * 100).toFixed(0)}%)`,
                          name,
                        ]}
                      />
                      <Legend formatter={(value, entry) => `${value} — $${entry.payload.value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm flex items-center justify-center h-full">
                Click a slice on the left to see its subcategory breakdown.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
