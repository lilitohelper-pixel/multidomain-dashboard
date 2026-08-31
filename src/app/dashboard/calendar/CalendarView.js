"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@/lib/supabase/client";
import { workspaceLabel } from "@/lib/displayNames";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymd(year, month0, day) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function todayISO() {
  const now = new Date();
  return ymd(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseYMD(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month0: month - 1, day };
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function weekdayShort(dateISO) {
  const { year, month0, day } = parseYMD(dateISO);
  return WEEKDAY_SHORT[new Date(year, month0, day).getDay()];
}

// Sunday of the current week (weeks run Monday-Sunday, matching firstDay={1}
// on the calendar below). Built via the Date constructor (not string padding)
// so day-of-month overflow correctly rolls into the next month/year.
function endOfWeekISO() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday);
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
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

function DayCard({ label, dayEvents, variant, onSelectEvent, showWeekday }) {
  const isToday = variant === "today";
  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={
        isToday
          ? { background: "var(--nav-bg)", color: "var(--nav-text)", borderColor: "var(--nav-bg)" }
          : { background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" }
      }
    >
      <h3 className="text-lg font-semibold">{label}</h3>
      {dayEvents.length === 0 ? (
        <p className="text-sm" style={{ color: isToday ? "var(--nav-muted)" : "var(--text-muted)" }}>
          No events.
        </p>
      ) : (
        <ul className="space-y-2">
          {dayEvents.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onSelectEvent(e)}
                className={`w-full flex items-center justify-between gap-3 text-left rounded px-1 -mx-1 ${
                  isToday ? "hover:bg-white/10" : "hover:bg-[var(--surface-alt)]"
                }`}
              >
                <span className="truncate">{e.title}</span>
                <span className="whitespace-nowrap font-medium">
                  {showWeekday ? `${weekdayShort(e.start_date)} ` : ""}
                  {e.start_time ? e.start_time.slice(0, 5) : "All day"}
                </span>
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
    <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-1">
      <p className="text-xs font-medium text-[var(--text)]">Guests</p>
      {eventGuests.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No guests invited yet.</p>
      ) : (
        <ul className="space-y-1">
          {eventGuests.map((g) => (
            <li key={g.id} className="flex items-center justify-between text-xs">
              <span>
                {g.email} <span className="text-[var(--text-muted)]">({g.status})</span>
              </span>
              <button onClick={() => onRemove(g.id)} className="text-[var(--text-faint)] hover:text-[var(--holiday-text)]">
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
          className="flex-1 min-w-0 border border-[var(--border)] rounded px-2 py-1 text-xs"
        />
        <button type="submit" className="text-xs bg-[var(--action)] text-[var(--action-text)] px-2 py-1 rounded shrink-0">
          Invite
        </button>
      </form>
      <p className="text-[10px] text-[var(--text-muted)]">
        Guests are tracked here, but invite emails aren&apos;t sent automatically yet.
      </p>
    </div>
  );
}

function EventEditModal({ event: e, onClose, onUpdate, guests, onAddGuest, onRemoveGuest }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 w-full max-w-md space-y-2"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            defaultValue={e.title}
            onBlur={(ev) => ev.target.value !== e.title && onUpdate(e.id, { title: ev.target.value })}
            className="font-medium bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-1 flex-1 min-w-0"
          />
          <button onClick={onClose} className="text-[var(--text-faint)] hover:text-[var(--text)] shrink-0">
            ✕
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="date"
            defaultValue={e.start_date}
            onChange={(ev) => ev.target.value && onUpdate(e.id, { start_date: ev.target.value })}
            className="border border-[var(--border)] rounded px-2 py-1"
          />
          <label className="flex items-center gap-2 cursor-pointer ml-1">
            <span className="text-[var(--text)]">All day</span>
            <span className="relative inline-flex items-center shrink-0">
              <input
                type="checkbox"
                checked={!e.start_time}
                onChange={(ev) =>
                  onUpdate(e.id, ev.target.checked ? { start_time: null, end_time: null } : { start_time: "09:00:00" })
                }
                className="sr-only peer"
              />
              <span className="w-9 h-5 bg-[var(--border-strong)] rounded-full peer-checked:bg-[var(--action)] transition-colors" />
              <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-[var(--surface)] rounded-full transition-transform peer-checked:translate-x-4" />
            </span>
          </label>
        </div>
        {!e.start_time ? null : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="time"
              defaultValue={e.start_time ? e.start_time.slice(0, 5) : ""}
              onChange={(ev) => onUpdate(e.id, { start_time: ev.target.value || null })}
              className="border border-[var(--border)] rounded px-2 py-1"
            />
            <span className="text-[var(--text-muted)]">to</span>
            <input
              type="time"
              defaultValue={e.end_time ? e.end_time.slice(0, 5) : ""}
              onChange={(ev) => onUpdate(e.id, { end_time: ev.target.value || null })}
              className="border border-[var(--border)] rounded px-2 py-1"
            />
          </div>
        )}
        <input
          type="text"
          defaultValue={e.location || ""}
          placeholder="Location"
          onBlur={(ev) => ev.target.value !== (e.location || "") && onUpdate(e.id, { location: ev.target.value || null })}
          className="w-full border border-[var(--border)] rounded px-2 py-1 text-sm"
        />
        <GuestList eventId={e.id} guests={guests} onAdd={onAddGuest} onRemove={onRemoveGuest} />
      </div>
    </div>
  );
}

function NewEventModal({ draft, workspaces, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(draft.start_date);
  const [allDay, setAllDay] = useState(!draft.start_time);
  const [startTime, setStartTime] = useState(draft.start_time ? draft.start_time.slice(0, 5) : "09:00");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!title.trim() || !workspaceId) return;
    setSaving(true);
    await onCreate({
      title: title.trim(),
      start_date: date,
      start_time: allDay ? null : `${startTime}:00`,
      end_time: allDay || !endTime ? null : `${endTime}:00`,
      location: location.trim() || null,
      workspace_id: workspaceId,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 w-full max-w-md space-y-2"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder="Event title"
            className="font-medium bg-transparent border-none focus:ring-1 focus:ring-[var(--action)] rounded px-1 flex-1 min-w-0"
          />
          <button type="button" onClick={onClose} className="text-[var(--text-faint)] hover:text-[var(--text)] shrink-0">
            ✕
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="date"
            value={date}
            onChange={(ev) => setDate(ev.target.value)}
            className="border border-[var(--border)] rounded px-2 py-1"
          />
          <label className="flex items-center gap-2 cursor-pointer ml-1">
            <span className="text-[var(--text)]">All day</span>
            <span className="relative inline-flex items-center shrink-0">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(ev) => setAllDay(ev.target.checked)}
                className="sr-only peer"
              />
              <span className="w-9 h-5 bg-[var(--border-strong)] rounded-full peer-checked:bg-[var(--action)] transition-colors" />
              <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-[var(--surface)] rounded-full transition-transform peer-checked:translate-x-4" />
            </span>
          </label>
        </div>
        {!allDay && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="time"
              value={startTime}
              onChange={(ev) => setStartTime(ev.target.value)}
              className="border border-[var(--border)] rounded px-2 py-1"
            />
            <span className="text-[var(--text-muted)]">to</span>
            <input
              type="time"
              value={endTime}
              onChange={(ev) => setEndTime(ev.target.value)}
              className="border border-[var(--border)] rounded px-2 py-1"
            />
          </div>
        )}
        <input
          type="text"
          value={location}
          onChange={(ev) => setLocation(ev.target.value)}
          placeholder="Location"
          className="w-full border border-[var(--border)] rounded px-2 py-1 text-sm"
        />
        {workspaces.length > 1 && (
          <select
            value={workspaceId}
            onChange={(ev) => setWorkspaceId(ev.target.value)}
            className="w-full border border-[var(--border)] rounded px-2 py-1 text-sm"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {workspaceLabel(w)}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={!title.trim() || !workspaceId || saving}
          className="w-full bg-[var(--action)] text-[var(--action-text)] text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add meeting"}
        </button>
        <p className="text-[10px] text-[var(--text-muted)]">You can invite guests after creating the meeting.</p>
      </form>
    </div>
  );
}

export default function CalendarView({ events: initialEvents, holidays = [], currentUserId, initialGuests = [], workspaces = [] }) {
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState(initialEvents);
  useEffect(() => setEvents(initialEvents), [initialEvents]);
  const [guests, setGuests] = useState(initialGuests);
  useEffect(() => setGuests(initialGuests), [initialGuests]);

  const [editingEventId, setEditingEventId] = useState(null);
  const [draftEvent, setDraftEvent] = useState(null);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const dateClickTimerRef = useRef(null);

  // dayCellDidMount below bakes resolved theme colors into inline styles at
  // mount time (FullCalendar's own CSS-var theming doesn't reach cells we
  // style imperatively), so the grid needs a full remount to pick up a
  // theme switch — keying the calendar on the theme id forces that.
  const [theme, setTheme] = useState("ember");
  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.getAttribute("data-theme") || "ember");
    const observer = new MutationObserver(() => setTheme(root.getAttribute("data-theme") || "ember"));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const holidayByDate = useMemo(() => {
    const map = {};
    for (const h of holidays) map[h.date] = h.name;
    return map;
  }, [holidays]);

  const fcEvents = events.map(toFullCalendarEvent);
  const editingEvent = editingEventId ? events.find((e) => e.id === editingEventId) || null : null;

  const todayDate = todayISO();
  const weekEndDate = endOfWeekISO();
  const todayEvents = useMemo(() => events.filter((e) => e.start_date === todayDate), [events, todayDate]);
  // "This week" is the rest of the week, not counting today (already shown
  // in its own card above), sorted chronologically since it now spans days.
  const thisWeekEvents = useMemo(
    () =>
      events
        .filter((e) => e.start_date > todayDate && e.start_date <= weekEndDate)
        .sort((a, b) => (a.start_date + (a.start_time || "")).localeCompare(b.start_date + (b.start_time || ""))),
    [events, todayDate, weekEndDate]
  );

  async function updateEvent(id, changes) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    const { error } = await supabase.from("calendar_events").update(changes).eq("id", id);
    if (error) console.error("Failed to update event:", error.message);
    router.refresh();
  }

  async function createEvent(fields) {
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({ ...fields, created_by_user_id: currentUserId })
      .select("*, workspaces(name, is_personal)")
      .single();
    if (error) {
      console.error("Failed to create event:", error.message);
      return;
    }
    setEvents((prev) => [...prev, data]);
    setDraftEvent(null);
    setEditingEventId(data.id); // jump straight into edit mode so guests can be added right away
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

  useEffect(() => () => clearTimeout(dateClickTimerRef.current), []);

  return (
    <div className="grid md:grid-cols-[440px_1fr] gap-6 items-start">
      <div className="space-y-4">
        <DayCard label="Today" dayEvents={todayEvents} variant="today" onSelectEvent={(e) => setEditingEventId(e.id)} />
        <DayCard
          label="This week"
          dayEvents={thisWeekEvents}
          variant="week"
          showWeekday
          onSelectEvent={(e) => setEditingEventId(e.id)}
        />
      </div>

      <div ref={containerRef}>
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden p-4">
          <FullCalendar
            key={theme}
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            firstDay={1}
            headerToolbar={{
              left: "prev,next",
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
            expandRows
            dayMaxEventRows={2}
            eventTimeFormat={{ hour: "numeric", minute: "2-digit", omitZeroMinute: true, meridiem: "short" }}
            events={fcEvents}
            editable
            datesSet={(arg) => {
              // Day/Week views default to scrolling to 6am so there's no need
              // to scroll past empty early-morning hours - but if something's
              // scheduled earlier than that, scroll to the earliest event
              // instead so it's visible without scrolling either.
              if (!arg.view.type.startsWith("timeGrid")) return;
              const rangeStart = ymd(arg.start.getFullYear(), arg.start.getMonth(), arg.start.getDate());
              const rangeEnd = ymd(arg.end.getFullYear(), arg.end.getMonth(), arg.end.getDate());
              let earliestMinutes = 6 * 60;
              for (const e of events) {
                if (!e.start_time || e.start_date < rangeStart || e.start_date >= rangeEnd) continue;
                earliestMinutes = Math.min(earliestMinutes, timeToMinutes(e.start_time));
              }
              const hh = Math.floor(earliestMinutes / 60);
              const mm = earliestMinutes % 60;
              calendarRef.current?.getApi()?.scrollToTime(`${pad2(hh)}:${pad2(mm)}:00`);
            }}
            dateClick={(info) => {
              // FullCalendar has no separate "double click" hook, so a single
              // dateClick handler distinguishes them itself two ways: the
              // native MouseEvent.detail is 2+ on the second click of a real
              // double-click, and as a fallback, a second dateClick landing
              // before the first one's queued timer elapses is treated as
              // the same pair (covers input devices that don't report detail
              // reliably). Either signal cancels the queued single-click
              // action and opens the create-event popup instead.
              const isDoubleClick = (info.jsEvent?.detail ?? 1) >= 2;
              if (isDoubleClick || dateClickTimerRef.current) {
                clearTimeout(dateClickTimerRef.current);
                dateClickTimerRef.current = null;
                const parts = dateTimeParts(info.date);
                // Double-clicking a month-view day cell reports allDay=true
                // since it has no time component, but that shouldn't make
                // the new-event popup default to an all-day event — give it
                // a normal starting time instead, same as a timed click.
                setDraftEvent({ start_date: parts.date, start_time: info.allDay ? "09:00:00" : parts.time });
                return;
              }
              dateClickTimerRef.current = setTimeout(() => {
                dateClickTimerRef.current = null;
                calendarRef.current?.getApi()?.changeView("timeGridDay", info.date);
              }, 250);
            }}
            eventClick={(info) => {
              if (!info.event.extendedProps.isHoliday) setEditingEventId(info.event.id);
            }}
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
              // expandRows only stretches shorter rows up to match the
              // tallest one — it can't shrink a row back down when one day
              // in it needs more lines than the rest (e.g. 3 events vs 0-1
              // elsewhere). Reserving the same event-area height in every
              // cell up front, regardless of content, means every row's
              // *natural* height is already equal before expandRows runs.
              const eventsContainer = arg.el.querySelector(".fc-daygrid-day-events");
              if (eventsContainer) eventsContainer.style.minHeight = "44px";

              const rootStyle = getComputedStyle(document.documentElement);
              const dayOfWeek = arg.date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              if (isWeekend) {
                arg.el.style.backgroundColor = rootStyle.getPropertyValue("--day-weekend").trim();
              }

              // Inserted imperatively (not via dayCellContent) because that hook
              // only replaces content *inside* FullCalendar's day-number badge —
              // a full-width flex row placed there fights the badge's own sizing
              // and overlaps the number. Flexing the day-top container itself and
              // inserting a sibling label keeps the badge's own layout intact.
              const dateStr = ymd(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate());
              const holidayName = holidayByDate[dateStr];
              if (!holidayName) return;

              arg.el.style.backgroundColor = rootStyle.getPropertyValue("--holiday-bg").trim();

              const top = arg.el.querySelector(".fc-daygrid-day-top");
              if (top && !top.querySelector(".holiday-label")) {
                top.style.display = "flex";
                top.style.alignItems = "center";
                // .fc-daygrid-day-top defaults to a fit-content width (it
                // normally wraps only the small day-number badge), so it
                // must be forced to span the full cell before space-between
                // has any extra room to distribute — otherwise the label and
                // number just sit bunched together wherever the box happens
                // to be, with real empty cell space outside the flex box.
                top.style.width = "100%";
                top.style.justifyContent = "space-between";
                // FullCalendar's own stylesheet sets flex-direction:
                // row-reverse on this element (its own trick for
                // right-aligning the day number normally) — left as-is, our
                // DOM order (label, then number) would render reversed,
                // putting the number on the left instead.
                top.style.flexDirection = "row";
                const label = document.createElement("span");
                label.className = "holiday-label";
                label.textContent = holidayName;
                label.style.cssText = `font-size:10px;font-weight:600;color:${rootStyle
                  .getPropertyValue("--holiday-text")
                  .trim()};flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:4px;`;
                top.insertBefore(label, top.firstChild);
              }
            }}
          />
        </div>
      </div>

      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onClose={() => setEditingEventId(null)}
          onUpdate={updateEvent}
          guests={guests}
          onAddGuest={addGuest}
          onRemoveGuest={removeGuest}
        />
      )}

      {draftEvent && (
        <NewEventModal draft={draftEvent} workspaces={workspaces} onClose={() => setDraftEvent(null)} onCreate={createEvent} />
      )}
    </div>
  );
}
