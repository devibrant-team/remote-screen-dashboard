// ScreenHeader.tsx
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import AddBranchModal from "./AddBranchModal";
import BranchDropdown from "../../Components/Dropdown/BranchDropdown";
import FilterBranchDropdown from "../../Components/Dropdown/FilterBranchDropdown";

const ScreenHeader = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Branch Selector + Add Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <FilterBranchDropdown />
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold transition hover:scale-105 focus:ring-offset-1"
          >
            <Plus size={18} color="red" />
            <p
              className="text-red-500 hover:text-red-600 cursor-pointer"
              onClick={() => setIsAddOpen(true)}
            >
              New Branch
            </p>
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

      {/* Modal (opens only from the button) */}
      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
};

export default ScreenHeader;
