"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";

function toFullCalendarEvent(row) {
  const allDay = !row.start_time;
  const start = allDay ? row.start_date : `${row.start_date}T${row.start_time}`;
  const end = !allDay && row.end_time ? `${row.start_date}T${row.end_time}` : undefined;

  return {
    id: row.id,
    title: row.title + (row.workspaces?.name ? ` (${row.workspaces.name})` : ""),
    start,
    end,
    allDay,
    extendedProps: { location: row.location },
  };
}

export default function CalendarView({ events }) {
  const [selected, setSelected] = useState(null);
  const fcEvents = events.map(toFullCalendarEvent);

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
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
          const row = events.find((e) => e.id === info.event.id);
          setSelected(row);
        }}
        height="auto"
      />

      {selected && (
        <div className="mt-4 bg-white rounded-lg border p-4 flex items-start justify-between">
          <div>
            <p className="font-medium">{selected.title}</p>
            <p className="text-sm text-gray-500">
              {selected.start_date}
              {selected.start_time ? ` ${selected.start_time.slice(0, 5)}` : " (all day)"}
              {selected.location ? ` · ${selected.location}` : ""}
              {selected.workspaces?.name ? ` · ${selected.workspaces.name}` : ""}
            </p>
          </div>
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
