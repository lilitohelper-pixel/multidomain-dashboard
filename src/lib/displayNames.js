import { t } from "@/lib/i18n";

export function workspaceLabel(workspace, lang = "en") {
  if (!workspace) return "";
  return workspace.is_personal ? t(lang, "workspace_personal_label") : workspace.name;
}

// Returns null when the row was created by the current user themselves —
// callers should simply omit any "added by" note in that case.
export function creatorLabel(row, currentUserId) {
  if (row.created_by_user_id === currentUserId) return null;
  return row.telegram_first_name || "Someone";
}
