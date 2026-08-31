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
