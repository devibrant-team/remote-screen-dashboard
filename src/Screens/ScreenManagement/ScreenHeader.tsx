// ScreenHeader.tsx
import { useState } from "react";
import { Plus, Search } from "lucide-react";

const ScreenHeader = () => {
  const [, setIsAddOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col  sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Branch Selector + Add Button */}
        <div className="flex flex-col m:flex-row sm:items-center ">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
          >
            <Plus size={18} /> Add Branch
          </button>
        </div>

        {/* Right side: Search Input */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            placeholder="Search screens..."
            aria-label="Search screens"
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
          />
        </div>
      </div>
    </>
  );
};

export default ScreenHeader;
