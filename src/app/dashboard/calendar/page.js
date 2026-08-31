import { createClient } from "@/lib/supabase/server";
import { getHolidaysForTimezone } from "@/lib/holidays";
import CalendarView from "./CalendarClientWrapper";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: profile }, { data: workspaces }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*, workspaces(name, is_personal)")
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true }),
    supabase.from("users").select("timezone").eq("id", user.id).single(),
    supabase.from("workspaces").select("id, name, is_personal"),
  ]);

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
      <h1 className="text-2xl font-semibold mb-6">Calendar</h1>
      <CalendarView
        events={events || []}
        holidays={holidays}
        currentUserId={user.id}
        initialGuests={guests || []}
        workspaces={workspaces || []}
      />
    </div>
  );
}
