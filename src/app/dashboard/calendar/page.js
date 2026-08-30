import { createClient } from "@/lib/supabase/server";
import { getHolidaysForTimezone } from "@/lib/holidays";
import CalendarView from "./CalendarClientWrapper";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: profile }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*, workspaces(name, is_personal)")
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true }),
    supabase.from("users").select("timezone").eq("id", user.id).single(),
  ]);

  const currentYear = new Date().getFullYear();
  const holidays = profile?.timezone
    ? getHolidaysForTimezone(profile.timezone, [currentYear, currentYear + 1])
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Calendar</h1>
      <CalendarView events={events || []} holidays={holidays} currentUserId={user.id} />
    </div>
  );
}
