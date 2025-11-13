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

      
      </div>

      {/* Modal (opens only from the button) */}
      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
};

export default ScreenHeader;
