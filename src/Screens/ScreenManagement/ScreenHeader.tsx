// ScreenHeader.tsx
import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AddBranchModal from "./AddBranchModal";
import FilterBranchDropdown from "../../Components/Dropdown/FilterBranchDropdown";
import { GROUP_OK } from "@/ReactQuery/Group/GetGroup";
import { SCREEN_OK } from "@/ReactQuery/Screen/GetScreen";
import { BRANCHES_QK } from "@/ReactQuery/Branch/GetBranch";

const ScreenHeader = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      // invalidate both groups + screens → any active useGetGroups/useGetScreen will refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GROUP_OK }),
        queryClient.invalidateQueries({ queryKey: SCREEN_OK }),
        queryClient.invalidateQueries({ queryKey: BRANCHES_QK }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

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
            <span className="text-red-500 hover:text-red-600 cursor-pointer">
              New Branch
            </span>
          </button>
        </div>

        {/* Right side: Refresh */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Modal */}
      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
};

export default ScreenHeader;
