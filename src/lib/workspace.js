export async function getUserWorkspaces(supabase, userId) {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspaces(id, name, is_personal)")
    .eq("user_id", userId);
  return (data || []).map((row) => row.workspaces).filter(Boolean);
}

// The active workspace is what the Telegram bot already uses to decide which
// workspace a DM'd message posts into (public.users.active_workspace_id) —
// reusing it here means switching it on the dashboard also changes where the
// bot files new messages, and vice versa; one setting, not two.
export async function getActiveWorkspaceId(supabase, userId, workspaces) {
  const { data } = await supabase.from("users").select("active_workspace_id").eq("id", userId).maybeSingle();
  const id = data?.active_workspace_id;
  if (id && workspaces.some((w) => w.id === id)) return id;
  return workspaces.find((w) => w.is_personal)?.id || workspaces[0]?.id || null;
}
