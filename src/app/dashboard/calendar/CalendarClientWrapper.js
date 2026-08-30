"use client";

import dynamic from "next/dynamic";

// FullCalendar manipulates the DOM imperatively via Preact internally, which
// conflicts with React's hydration on the initial server-rendered page load.
// Disabling SSR for it avoids that entirely.
const CalendarView = dynamic(() => import("./CalendarView"), { ssr: false });

export default function CalendarClientWrapper(props) {
  return <CalendarView {...props} />;
}
