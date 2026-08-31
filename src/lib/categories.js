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

export function categoryPathLabel(byId, id) {
  const parts = [];
  let cur = byId.get(id);
  while (cur) {
    parts.unshift(cur.name);
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

// A fixed color per top-level category so a category keeps the same color
// across periods, regardless of which categories have data in a given range.
export const CATEGORY_COLORS = {
  Household: "#1f77b4",
  Food: "#f4a261",
  Entertainment: "#1b5e20",
  "Pet care": "#29b6d6",
  Savings: "#9c27b0",
  Transportation: "#8bc34a",
  Travel: "#1a3d63",
  "Clothing shopping": "#8d5524",
  Other: "#9e9e9e",
};

// Deterministic thousands-separated formatting (no Intl/toLocaleString) so
// server and client render identically regardless of locale — avoids the same
// class of hydration mismatch this app hit before with date formatting.
export function formatAmount(n) {
  const rounded = Math.round((n || 0) * 100) / 100;
  const [intPart, decPart] = rounded.toFixed(2).split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart === "00" ? withSpaces : `${withSpaces}.${decPart}`;
}
