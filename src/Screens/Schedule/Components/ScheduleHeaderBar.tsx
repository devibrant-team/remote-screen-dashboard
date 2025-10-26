export default function ScheduleHeaderBar() {
  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-start justify-between">
      {/* left side */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* back + title input */}
        <div className="flex items-center gap-3 min-w-0">
          <button className="text-[13px] text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <span className="text-xl leading-none">←</span>
            <span className="underline decoration-gray-300 underline-offset-2">
              All Schedules
            </span>
          </button>

          <input
            className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-[#1a1f2e] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
            defaultValue="Schedule 1-copy"
          />
        </div>

        {/* toolbar row */}
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#1a1f2e] font-medium">
          <button className="flex items-center justify-center rounded bg-[#1a1f2e] text-white text-[14px] font-semibold h-8 w-8 leading-none shadow-sm hover:opacity-90">
            +
          </button>

          <button className="h-8 rounded border border-gray-300 bg-white px-3 leading-none shadow-sm hover:bg-gray-50">
            Today
          </button>

          <div className="flex h-8 rounded border border-gray-300 bg-white shadow-sm overflow-hidden">
            <button className="px-2 hover:bg-gray-50">‹</button>
            <div className="w-px bg-gray-300" />
            <button className="px-2 hover:bg-gray-50">›</button>
          </div>

          <div className="text-[14px] font-semibold text-[#1a1f2e] px-2">
            Oct 20 – 26, 2025
          </div>

          <div>
            <button className="h-8 rounded border border-gray-300 bg-white px-3 leading-none shadow-sm flex items-center gap-2 hover:bg-gray-50">
              <span>Week</span>
              <span className="text-xs">▾</span>
            </button>
          </div>
        </div>
      </div>

      {/* right side */}
      <div className="flex items-start gap-2">
        <button className="h-8 rounded border border-gray-300 bg-white px-3 text-[13px] font-medium leading-none text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button className="h-8 rounded bg-orange-500 px-3 text-[13px] font-semibold leading-none text-white shadow hover:bg-orange-600">
          Save
        </button>
        <button className="h-8 rounded border border-orange-500 bg-orange-50 px-2 text-[13px] font-semibold leading-none text-orange-600 shadow hover:bg-orange-100">
          ▾
        </button>
      </div>
    </div>
  );
}
