import { ArrowBigLeft, Menu, X } from "lucide-react";
import { useState } from "react";
import NormalContent from "./NormalContent";
import InteractiveContent from "./InteractiveContent";
import { useNavigate } from "react-router-dom";

const ScheduleToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/mediacontent");
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 rounded-xl border border-neutral-200 bg-white/90 p-2 shadow-xs backdrop-blur transition active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 z-40 h-screen w-72 transform bg-gradient-to-b from-white to-neutral-50 shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:static md:h-auto md:w-72 md:translate-x-0 md:shadow-none`}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <button
            onClick={handleCancel}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-xs hover:bg-neutral-50"
          >
            <ArrowBigLeft size={18} />
            <span>Back</span>
          </button>

          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
            Schedules
          </span>
        </div>

        {/* Scroll area */}
        <div className="flex h-[calc(100vh-52px)] flex-col gap-4 overflow-y-auto p-4 md:h-auto md:max-h-[calc(100vh-80px)]">
          {/* Block: Normal Playlists */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h1 className="text-sm font-semibold tracking-wide text-neutral-800">
                Show Playlists
              </h1>
              <div
                className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(252,165,165,0.35)]
"
              />
            </div>
            <div className="p-3">
              <NormalContent />
            </div>
          </div>

          {/* Block: Interactive Playlists */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h1 className="text-sm font-semibold tracking-wide text-neutral-800">
                Interactive Playlists
              </h1>
              <div
                className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(252,165,165,0.35)]

"
              />
            </div>
            <div className="p-3">
              <InteractiveContent />
            </div>
          </div>

          {/* Subtle footer */}
          <div className="mt-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-3 text-center text-xs text-neutral-500">
            Tip: Drag your desire playlist directly to the schedule.
          </div>
        </div>
      </nav>
    </>
  );
};

export default ScheduleToolbar;
