import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, workspaces(name)")
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Calendar</h1>
      {events && events.length > 0 ? (
        <div className="bg-white rounded-lg border divide-y">
          {events.map((e) => (
            <div key={e.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-gray-500">
                  {e.location || "no location"} · {e.workspaces?.name}
                </p>
              </div>
              <span className="text-sm text-gray-500">
                {e.start_date} {e.start_time ? e.start_time.slice(0, 5) : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No events yet — send one to your bot on Telegram.</p>
      )}
    </div>
  );
}
