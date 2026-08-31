"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@/lib/supabase/client";
import { workspaceLabel, creatorLabel } from "@/lib/displayNames";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymd(year, month0, day) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function todayISO() {
  const now = new Date();
  return ymd(now.getFullYear(), now.getMonth(), now.getDate());
}

function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return ymd(now.getFullYear(), now.getMonth(), now.getDate());
}

// FullCalendar's event.start/end for our events are "naive" local datetimes
// (we never give it a UTC 'Z' suffix), so getHours()/getMinutes() etc. read
// back the same wall-clock value we put in — no timezone conversion involved.
function dateTimeParts(date) {
  return {
    date: ymd(date.getFullYear(), date.getMonth(), date.getDate()),
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`,
  };
}

function toFullCalendarEvent(row) {
  const allDay = !row.start_time;
  const start = allDay ? row.start_date : `${row.start_date}T${row.start_time}`;
  const end = !allDay && row.end_time ? `${row.start_date}T${row.end_time}` : undefined;

  return {
    id: row.id,
    title: row.title,
    start,
    end,
    allDay,
    extendedProps: { location: row.location },
  };
}

function DayCard({ label, dateISO, dayEvents, variant, onSelectDate }) {
  const isToday = variant === "today";
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 ${
        isToday ? "bg-moss-sage text-stone-parchment border-moss-sage" : "bg-stone-parchment text-bark-walnut border-bark-walnut"
      }`}
    >
      <h3 className="text-lg font-semibold">{label}</h3>
      {dayEvents.length === 0 ? (
        <p className={`text-sm ${isToday ? "text-stone-parchment/80" : "text-stone-taupe"}`}>No events.</p>
      ) : (
        <ul className="space-y-2">
          {dayEvents.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onSelectDate(dateISO)}
                className={`w-full flex items-center justify-between gap-3 text-left rounded px-1 -mx-1 ${
                  isToday ? "hover:bg-white/10" : "hover:bg-stone-linen"
                }`}
              >
                <span className="truncate">{e.title}</span>
                <span className="whitespace-nowrap font-medium">{e.start_time ? e.start_time.slice(0, 5) : "All day"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GuestList({ eventId, guests, onAdd, onRemove }) {
  const [email, setEmail] = useState("");
  const eventGuests = guests.filter((g) => g.event_id === eventId);

  return (
    <div className="mt-2 pt-2 border-t space-y-1">
      <p className="text-xs font-medium text-bark-umber">Guests</p>
      {eventGuests.length === 0 ? (
        <p className="text-xs text-stone-taupe">No guests invited yet.</p>
      ) : (
        <ul className="space-y-1">
          {eventGuests.map((g) => (
            <li key={g.id} className="flex items-center justify-between text-xs">
              <span>
                {g.email} <span className="text-stone-taupe">({g.status})</span>
              </span>
              <button onClick={() => onRemove(g.id)} className="text-stone-grey hover:text-amber-rust">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!email.trim()) return;
          onAdd(eventId, email.trim());
          setEmail("");
        }}
        className="flex gap-1 mt-1"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="Invite by email"
          className="flex-1 min-w-0 border rounded px-2 py-1 text-xs"
        />
        <button type="submit" className="text-xs bg-forest-hunter text-stone-parchment px-2 py-1 rounded shrink-0">
          Invite
        </button>
      </form>
      <p className="text-[10px] text-stone-taupe">
        Guests are tracked here, but invite emails aren&apos;t sent automatically yet.
      </p>
    </div>
  );
}

function EditableEventRow({ event: e, isEditing, onStartEdit, onStopEdit, onUpdate, currentUserId, guests, onAddGuest, onRemoveGuest }) {
  if (!isEditing) {
    return (
      <li>
        <button
          onClick={onStartEdit}
          className="w-full text-left flex items-center justify-between gap-4 hover:bg-stone-linen rounded px-1 py-0.5"
        >
          <span>{e.title}</span>
          <span className="text-sm text-stone-taupe whitespace-nowrap">
            {e.start_time ? e.start_time.slice(0, 5) : "All day"}
            {e.location ? ` · ${e.location}` : ""}
            {" · "}
            {workspaceLabel(e.workspaces)}
            {creatorLabel(e, currentUserId) && ` · Added by ${creatorLabel(e, currentUserId)}`}
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className="bg-stone-linen rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          defaultValue={e.title}
          onBlur={(ev) => ev.target.value !== e.title && onUpdate(e.id, { title: ev.target.value })}
          className="font-medium bg-transparent border-none focus:ring-1 focus:ring-forest-juniper rounded px-1 flex-1 min-w-0"
        />
        <button onClick={onStopEdit} className="text-sm text-forest-hunter hover:underline shrink-0">
          Done
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="date"
          defaultValue={e.start_date}
          onChange={(ev) => ev.target.value && onUpdate(e.id, { start_date: ev.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="time"
          defaultValue={e.start_time ? e.start_time.slice(0, 5) : ""}
          onChange={(ev) => onUpdate(e.id, { start_time: ev.target.value || null })}
          className="border rounded px-2 py-1"
        />
        <span className="text-stone-taupe">to</span>
        <input
          type="time"
          defaultValue={e.end_time ? e.end_time.slice(0, 5) : ""}
          onChange={(ev) => onUpdate(e.id, { end_time: ev.target.value || null })}
          className="border rounded px-2 py-1"
        />
      </div>
      <input
        type="text"
        defaultValue={e.location || ""}
        placeholder="Location"
        onBlur={(ev) => ev.target.value !== (e.location || "") && onUpdate(e.id, { location: ev.target.value || null })}
        className="w-full border rounded px-2 py-1 text-sm"
      />
      <GuestList eventId={e.id} guests={guests} onAdd={onAddGuest} onRemove={onRemoveGuest} />
    </li>
  );
}

export default function CalendarView({ events: initialEvents, holidays = [], currentUserId, initialGuests = [] }) {
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState(initialEvents);
  useEffect(() => setEvents(initialEvents), [initialEvents]);
  const [guests, setGuests] = useState(initialGuests);
  useEffect(() => setGuests(initialGuests), [initialGuests]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);

  const holidayByDate = useMemo(() => {
    const map = {};
    for (const h of holidays) map[h.date] = h.name;
    return map;
  }, [holidays]);

  const fcEvents = events.map(toFullCalendarEvent);

  const todayDate = todayISO();
  const tomorrowDate = tomorrowISO();
  const todayEvents = useMemo(() => events.filter((e) => e.start_date === todayDate), [events, todayDate]);
  const tomorrowEvents = useMemo(() => events.filter((e) => e.start_date === tomorrowDate), [events, tomorrowDate]);

  async function updateEvent(id, changes) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    const { error } = await supabase.from("calendar_events").update(changes).eq("id", id);
    if (error) console.error("Failed to update event:", error.message);
    router.refresh();
  }

  async function addGuest(eventId, email) {
    const { data, error } = await supabase.from("event_guests").insert({ event_id: eventId, email }).select().single();
    if (error) {
      console.error("Failed to add guest:", error.message);
      return;
    }
    setGuests((prev) => [...prev, data]);
  }

  async function removeGuest(guestId) {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    const { error } = await supabase.from("event_guests").delete().eq("id", guestId);
    if (error) console.error("Failed to remove guest:", error.message);
  }

  useEffect(() => {
    // FullCalendar can measure a zero/incorrect container width on the very
    // first paint after a fresh page load, producing a broken layout (a
    // one-time delayed recalculation isn't reliable enough — web font loading
    // and other async reflows can shift the size afterward). Watching the
    // container with ResizeObserver and recalculating on every real size
    // change fixes it robustly regardless of cause or timing.
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      calendarRef.current?.getApi()?.updateSize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
      <div className="space-y-4">
        <DayCard label="Today" dateISO={todayDate} dayEvents={todayEvents} variant="today" onSelectDate={setSelectedDate} />
        <DayCard
          label="Tomorrow"
          dateISO={tomorrowDate}
          dayEvents={tomorrowEvents}
          variant="tomorrow"
          onSelectDate={setSelectedDate}
        />
      </div>

      <div ref={containerRef}>
      <div className="bg-stone-parchment rounded-lg border overflow-hidden p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        firstDay={1}
        headerToolbar={{
          left: "prev,next gotoToday",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth,multiMonthYear",
        }}
        buttonText={{
          multiMonthYear: "Year",
          dayGridMonth: "Month",
          timeGridWeek: "Week",
          timeGridDay: "Day",
        }}
        height={720}
        dayMaxEventRows={3}
        customButtons={{
          // Named "gotoToday" rather than the reserved "today" — FullCalendar
          // auto-disables a button named "today" whenever the current view
          // already contains today's date (the common case), which silently
          // swallows clicks exactly when someone would want to use it.
          gotoToday: {
            text: "Today",
            click: () => {
              calendarRef.current?.getApi()?.today();
              setSelectedDate(todayISO());
            },
          },
        }}
        events={fcEvents}
        editable
        dateClick={(info) => setSelectedDate(info.dateStr.slice(0, 10))}
        eventClick={(info) => setSelectedDate(info.event.startStr.slice(0, 10))}
        eventDrop={(info) => {
          const startParts = dateTimeParts(info.event.start);
          const changes = { start_date: startParts.date };
          if (info.event.allDay) {
            changes.start_time = null;
            changes.end_time = null;
          } else {
            changes.start_time = startParts.time;
            changes.end_time = info.event.end ? dateTimeParts(info.event.end).time : null;
          }
          updateEvent(info.event.id, changes);
        }}
        eventResize={(info) => {
          if (!info.event.end) return;
          updateEvent(info.event.id, { end_time: dateTimeParts(info.event.end).time });
        }}
        dayCellDidMount={(arg) => {
          // Inserted imperatively (not via dayCellContent) because that hook
          // only replaces content *inside* FullCalendar's day-number badge —
          // a full-width flex row placed there fights the badge's own sizing
          // and overlaps the number. Flexing the day-top container itself and
          // inserting a sibling label keeps the badge's own layout intact.
          const dateStr = ymd(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate());
          const holidayName = holidayByDate[dateStr];
          if (!holidayName) return;

          arg.el.style.backgroundColor = "rgba(160, 64, 0, 0.12)";

          const top = arg.el.querySelector(".fc-daygrid-day-top");
          if (top && !top.querySelector(".holiday-label")) {
            top.style.display = "flex";
            top.style.alignItems = "center";
            const label = document.createElement("span");
            label.className = "holiday-label";
            label.textContent = holidayName;
            label.style.cssText =
              "font-size:10px;font-weight:600;color:#A04000;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:4px;";
            top.insertBefore(label, top.firstChild);
          }
        }}
      />
      </div>

      {selectedDate && (
        <div className="mt-4 bg-stone-parchment rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{selectedDate}</p>
              {holidayByDate[selectedDate] && (
                <p className="text-xs text-amber-rust font-medium">{holidayByDate[selectedDate]}</p>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedDate(null);
                setEditingEventId(null);
              }}
              className="text-stone-grey hover:text-bark-umber"
            >
              ✕
            </button>
          </div>
          {(() => {
            const dayEvents = events.filter((e) => e.start_date === selectedDate);
            if (dayEvents.length === 0) {
              return <p className="text-sm text-stone-taupe">No events on this day.</p>;
            }
            return (
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <EditableEventRow
                    key={e.id}
                    event={e}
                    isEditing={editingEventId === e.id}
                    onStartEdit={() => setEditingEventId(e.id)}
                    onStopEdit={() => setEditingEventId(null)}
                    onUpdate={updateEvent}
                    currentUserId={currentUserId}
                    guests={guests}
                    onAddGuest={addGuest}
                    onRemoveGuest={removeGuest}
                  />
                ))}
              </ul>
            );
          })()}
        </div>
      )}
      </div>
    </div>
  );
}
