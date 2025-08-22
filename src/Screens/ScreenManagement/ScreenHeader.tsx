import React from "react";
import { Plus, Search, SlidersHorizontal, ChevronDown } from "lucide-react";

export type BranchOption = { id: string | number; name: string };

type ScreenHeaderProps = {
  branchValue: string | number;
  setBranchValue: (v: string | number) => void;
  branches: BranchOption[];             // includes "All Branches"
  query: string;
  setQuery: (v: string) => void;
  onAddBranch: () => void;
  isBranchesLoading?: boolean;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  branchValue,
  setBranchValue,
  branches,
  query,
  setQuery,
  onAddBranch,
  isBranchesLoading = false,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {/* Branch Select */}
        <div className="relative">
          <select
            value={branchValue}
            onChange={(e) => setBranchValue(e.target.value)}
            disabled={isBranchesLoading}
            className="appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
            size={16}
          />
        </div>

        <button
          onClick={onAddBranch}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          <Plus size={18} /> Add Branch
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens..."
            className="w-72 rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
          />
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50">
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>
    </div>
  );
};

export default ScreenHeader;
