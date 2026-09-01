export function buildCategoryIndex(categories) {
  const byId = new Map();
  for (const c of categories) byId.set(c.id, c);
  return byId;
}

export function topLevelCategory(byId, id) {
  let cur = byId.get(id);
  if (!cur) return null;
  while (cur.parent_id) {
    const parent = byId.get(cur.parent_id);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}

// Returns the level-2 ancestor of `id` (the category directly under its top-level
// parent), or null if `id` is itself a top-level category with no subcategory.
export function secondLevelCategory(byId, id) {
  let cur = byId.get(id);
  if (!cur || !cur.parent_id) return null;
  while (true) {
    const parent = byId.get(cur.parent_id);
    if (!parent || !parent.parent_id) return cur;
    cur = parent;
  }
}

export function isIncomeCategory(byId, id) {
  return topLevelCategory(byId, id)?.name === "Income";
}

// `translateName` only affects the returned display string — callers that
// persist this value (the denormalized `expenses.category` snapshot) must
// call this without it, so what's saved always stays the canonical English
// path regardless of which language was active when the edit was made.
export function categoryPathLabel(byId, id, translateName = (n) => n) {
  const parts = [];
  let cur = byId.get(id);
  while (cur) {
    parts.unshift(translateName(cur.name));
    cur = cur.parent_id ? byId.get(cur.parent_id) : null;
  }
  return parts.join(" → ");
}

// Fixed top-level spending categories, in display order. Income is excluded —
// it isn't part of the expense breakdown.
export const TOP_LEVEL_CATEGORIES = [
  "Household",
  "Food",
  "Entertainment",
  "Pet care",
  "Savings",
  "Transportation",
  "Travel",
  "Clothing shopping",
  "Other",
];

// A fixed CSS custom property per top-level category, so a category keeps the
// same slot across periods and across theme switches (each theme resolves
// these variables to its own palette — see src/app/theme-tokens.css).
export const CATEGORY_COLOR_VARS = {
  Household: "--cat-household",
  Food: "--cat-food",
  Entertainment: "--cat-entertainment",
  "Pet care": "--cat-pet-care",
  Savings: "--cat-savings",
  Transportation: "--cat-transportation",
  Travel: "--cat-travel",
  "Clothing shopping": "--cat-clothing",
  Other: "--cat-other",
};

// Reads the current value of a CSS custom property from the document root.
// Used to resolve theme-aware colors (e.g. for Recharts, which needs real
// color strings and can't take a live `var(...)` reference).
export function resolveCssVar(name, fallback = "#999999") {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

// Deterministic thousands-separated formatting (no Intl/toLocaleString) so
// server and client render identically regardless of locale — avoids the same
// class of hydration mismatch this app hit before with date formatting.
export function formatAmount(n) {
  const rounded = Math.round((n || 0) * 100) / 100;
  const [intPart, decPart] = rounded.toFixed(2).split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart === "00" ? withSpaces : `${withSpaces}.${decPart}`;
}

// Amounts are always stored as positive numbers; the sign shown is derived
// from the category at display time — Income adds, everything else spends.
export function formatSignedAmount(n, isIncome) {
  return `${isIncome ? "+" : "-"}${formatAmount(n)}`;
}
