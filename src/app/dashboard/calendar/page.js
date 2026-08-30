import { createClient } from "@/lib/supabase/server";
import CalendarView from "./CalendarClientWrapper";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, workspaces(name, is_personal)")
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Calendar</h1>
      <CalendarView events={events || []} currentUserId={user.id} />
    </div>
  );
}
