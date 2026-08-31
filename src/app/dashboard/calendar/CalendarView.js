"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import { workspaceLabel, creatorLabel } from "@/lib/displayNames";

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

function toHolidayEvent(holiday, index) {
  return {
    id: `holiday-${index}`,
    title: holiday.name,
    start: holiday.date,
    allDay: true,
    display: "list-item",
    color: "#A04000", // amber.rust
    extendedProps: { isHoliday: true },
  };
}

export default function CalendarView({ events, holidays = [], currentUserId }) {
  const [selected, setSelected] = useState(null);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const fcEvents = [...events.map(toFullCalendarEvent), ...holidays.map(toHolidayEvent)];

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
    <div ref={containerRef}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
        firstDay={1}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          multiMonthYear: "Year",
          dayGridMonth: "Month",
          timeGridWeek: "Week",
          timeGridDay: "Day",
          today: "Today",
        }}
        events={fcEvents}
        eventClick={(info) => {
          if (info.event.extendedProps.isHoliday) return;
          const row = events.find((e) => e.id === info.event.id);
          setSelected(row);
        }}
        height="auto"
      />

      {selected && (
        <div className="mt-4 bg-stone-parchment rounded-lg border p-4 flex items-start justify-between">
          <div>
            <p className="font-medium">{selected.title}</p>
            <p className="text-sm text-stone-taupe">
              {selected.start_date}
              {selected.start_time ? ` ${selected.start_time.slice(0, 5)}` : " (all day)"}
              {selected.location ? ` · ${selected.location}` : ""}
              {" · "}
              {workspaceLabel(selected.workspaces)}
              {creatorLabel(selected, currentUserId) && ` · Added by ${creatorLabel(selected, currentUserId)}`}
            </p>
          </div>
          <button onClick={() => setSelected(null)} className="text-stone-grey hover:text-bark-umber">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
