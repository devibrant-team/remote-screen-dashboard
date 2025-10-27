import { useState } from "react";
import ScheduleCalendarArea from "./Components/ScheduleCalendarArea";

import ScheduleToolBar from "./ScheduleToolBar";
import ScheduleAssignSidebar from "./Components/ScheduleAssignSidebar";

export default function Schedule() {
  const [toolbarOpen, setToolbarOpen] = useState(false);           // mobile drawer
  const [mobileTab, setMobileTab] = useState<"calendar"|"events">("calendar"); // mobile content tabs

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fa] text-[#1a1f2e]">
      {/* ===== LEFT TOOLBAR (desktop persistent) ===== */}
      <aside className="hidden lg:flex w-[330px] shrink-0 border-r border-gray-200 bg-white px-4 py-4">
        <div className="flex h-full w-full flex-col">
          <ScheduleToolBar />
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: mobile controls + title (sticky) */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
            {/* Left: mobile menu button (opens toolbar drawer) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setToolbarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 lg:hidden"
                aria-label="Open content picker"
              >
                {/* hamburger */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h1 className="truncate text-sm font-semibold sm:text-base">Schedule</h1>
            </div>

            {/* Right: mobile tabs (Calendar / Events) */}
            <div className="lg:hidden">
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  className={
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
                    (mobileTab === "calendar"
                      ? "bg-[#1a1f2e] text-white"
                      : "text-gray-700 hover:bg-gray-50")
                  }
                  onClick={() => setMobileTab("calendar")}
                >
                  Calendar
                </button>
                <button
                  className={
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
                    (mobileTab === "events"
                      ? "bg-[#1a1f2e] text-white"
                      : "text-gray-700 hover:bg-gray-50")
                  }
                  onClick={() => setMobileTab("events")}
                >
                  Events
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        {/* Mobile: tabbed content (stacked); Desktop: split layout */}
        <div className="flex flex-1 min-h-0">
          {/* Mobile: show one tab at a time */}
          <div className="flex w-full flex-col lg:hidden">
            {mobileTab === "calendar" ? (
              <div className="min-h-[60vh] flex-1">
                <ScheduleCalendarArea />
              </div>
            ) : (
              <div className="min-h-[60vh] flex-1 border-t border-gray-200 bg-white">
                <ScheduleAssignSidebar />
              </div>
            )}
          </div>

          {/* Desktop: calendar + events split */}
          <div className="hidden lg:flex lg:flex-1 min-h-0">
            <section className="flex min-w-0 flex-1">
              <ScheduleCalendarArea />
            </section>
            <aside className="w-[360px] shrink-0 border-l border-gray-200 bg-white">
              <ScheduleAssignSidebar />
            </aside>
          </div>
        </div>
      </main>

      {/* ===== MOBILE DRAWER (toolbar) ===== */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          toolbarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setToolbarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-[360px] translate-x-[-100%] border-r border-gray-200 bg-white shadow-xl transition-transform lg:hidden
        ${toolbarOpen ? "translate-x-0" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="text-sm font-semibold">Content Picker</div>
          <button
            onClick={() => setToolbarOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-full overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
          <ScheduleToolBar />
        </div>
      </div>
    </div>
  );
}
