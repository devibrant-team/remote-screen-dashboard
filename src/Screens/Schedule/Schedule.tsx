import { useState } from "react";
import ScheduleToolBar from "./ScheduleToolbar";
import CalenderForScheduleItem from "./Calender/Calender";

export default function Schedule() {
  const [toolbarOpen, setToolbarOpen] = useState(false); // mobile drawer
  const [mobileTab, setMobileTab] = useState<"calendar" | "events">("calendar"); // mobile content tabs
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] text-[#1a1f2e] overflow-hidden">
      {/* ===== LEFT TOOLBAR (desktop persistent, sticky) ===== */}
      <aside
        className="
    hidden lg:flex w-[330px] shrink-0 border-r border-gray-200 bg-white
    lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
    /* hide the scrollbar cross-browser */
    lg:[scrollbar-width:none]                 /* Firefox */
    lg:[-ms-overflow-style:none]              /* old IE/Edge */
    lg:[&::-webkit-scrollbar]:hidden          /* Chrome/Safari/Edge */
    px-4 py-4
  "
      >
        <div className="flex h-full w-full flex-col">
          <ScheduleToolBar />
        </div>
      </aside>

      {/* ===== MAIN AREA (scrollable) ===== */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top bar: mobile controls + title (sticky) */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
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
        <div className="flex flex-1 min-h-0">
          {/* Mobile: tabbed content */}
          <div className="flex w-full flex-col lg:hidden">
            {mobileTab === "calendar" ? (
              <div className="min-h-[60vh] flex-1">
                <CalenderForScheduleItem />
              </div>
            ) : (
              <div className="min-h-[60vh] flex-1 border-t border-gray-200 bg-white">
                {/* sidebar mobile */}
              </div>
            )}
          </div>

          {/* Desktop: calendar + events split */}
          <div className="hidden lg:flex lg:flex-1 min-h-0">
            <section className="flex min-w-0 flex-1">
              <CalenderForScheduleItem />
            </section>
            {sidebarOpen && (
              <aside className="w-[360px] shrink-0 border-l border-gray-200 bg-white">
                {/* sidebar */}
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
