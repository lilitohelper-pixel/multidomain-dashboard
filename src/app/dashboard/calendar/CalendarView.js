"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
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
  const [selectedDate, setSelectedDate] = useState(null);
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
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
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
        dateClick={(info) => setSelectedDate(info.dateStr.slice(0, 10))}
        eventClick={(info) => {
          if (info.event.extendedProps.isHoliday) return;
          setSelectedDate(info.event.startStr.slice(0, 10));
        }}
        height="auto"
      />

      {selectedDate && (
        <div className="mt-4 bg-stone-parchment rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">{selectedDate}</p>
            <button onClick={() => setSelectedDate(null)} className="text-stone-grey hover:text-bark-umber">
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
                  <li key={e.id} className="flex items-center justify-between gap-4">
                    <span>{e.title}</span>
                    <span className="text-sm text-stone-taupe whitespace-nowrap">
                      {e.start_time ? e.start_time.slice(0, 5) : "All day"}
                      {e.location ? ` · ${e.location}` : ""}
                      {" · "}
                      {workspaceLabel(e.workspaces)}
                      {creatorLabel(e, currentUserId) && ` · Added by ${creatorLabel(e, currentUserId)}`}
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      )}
    </div>
  );
}
