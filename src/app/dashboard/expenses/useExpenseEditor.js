"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildCategoryIndex, categoryPathLabel } from "@/lib/categories";
import { translateCategoryName } from "@/lib/i18n";

// Shared editing logic for both the "recent expenses" preview table and the
// full paginated "All expenses" table, so an edit made in either place uses
// the same update/refresh behavior instead of two separate implementations.
export function useExpenseEditor(initialExpenses, categories, currentUserId, lang = "en") {
  const router = useRouter();
  const supabase = createClient();
  const byId = useMemo(() => buildCategoryIndex(categories), [categories]);
  const [expenses, setExpenses] = useState(initialExpenses);
  useEffect(() => setExpenses(initialExpenses), [initialExpenses]);

  // Every category is selectable, including Income — a controlled <select>
  // whose current value has no matching <option> silently falls back to
  // showing the first option instead, which looks like a wrong category.
  // Sorted/labeled with the translated name for display only — the value
  // saved to the database (below) always stays the canonical English path.
  const categoryOptions = useMemo(() => {
    return categories
      .map((c) => ({ id: c.id, label: categoryPathLabel(byId, c.id, (n) => translateCategoryName(lang, n)) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, byId, lang]);

  async function updateExpense(id, changes) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    const { error } = await supabase.from("expenses").update(changes).eq("id", id);
    if (error) console.error("Failed to update expense:", error.message);
    router.refresh();
  }

  function updateCategory(id, categoryId) {
    updateExpense(id, { category_id: categoryId, category: categoryPathLabel(byId, categoryId) });
  }

  async function deleteExpense(id) {
    const previous = expenses;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete expense:", error.message);
      setExpenses(previous);
    }
    router.refresh();
  }

  async function addExpense({ description, categoryId, date, amount, currency, workspaceId }) {
    const category = categoryId ? categoryPathLabel(byId, categoryId) : null;
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description,
        category_id: categoryId || null,
        category,
        date,
        amount,
        currency: currency || "USD",
        workspace_id: workspaceId,
        created_by_user_id: currentUserId,
        source: "manual",
      })
      .select("*, workspaces(name, is_personal)")
      .single();
    if (error) {
      console.error("Failed to add expense:", error.message);
      return { error };
    }
    setExpenses((prev) => [data, ...prev]);
    router.refresh();
    return { data };
  }

  return { expenses, byId, categoryOptions, updateExpense, updateCategory, deleteExpense, addExpense };
}
