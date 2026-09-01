import { createClient } from "@/lib/supabase/server";
import { getHolidaysForTimezone } from "@/lib/holidays";
import CalendarView from "./CalendarClientWrapper";
import { t } from "@/lib/i18n";
import { getUserWorkspaces, getActiveWorkspaceId } from "@/lib/workspace";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const workspaces = await getUserWorkspaces(supabase, user.id);
  const activeWorkspaceId = await getActiveWorkspaceId(supabase, user.id, workspaces);

  const [{ data: events }, { data: profile }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*, workspaces(name, is_personal)")
      .eq("workspace_id", activeWorkspaceId)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true }),
    supabase.from("users").select("timezone, language").eq("id", user.id).single(),
  ]);
  const lang = ["en", "hu", "ru"].includes(profile?.language) ? profile.language : "en";

  const eventIds = (events || []).map((e) => e.id);
  const { data: guests } = eventIds.length
    ? await supabase.from("event_guests").select("*").in("event_id", eventIds)
    : { data: [] };

  const currentYear = new Date().getFullYear();
  const holidays = profile?.timezone
    ? getHolidaysForTimezone(profile.timezone, [currentYear, currentYear + 1])
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t(lang, "calendar_title")}</h1>
      <CalendarView
        events={events || []}
        holidays={holidays}
        currentUserId={user.id}
        initialGuests={guests || []}
        workspaces={workspaces}
        defaultWorkspaceId={activeWorkspaceId}
        lang={lang}
      />
    </div>
  );
}
