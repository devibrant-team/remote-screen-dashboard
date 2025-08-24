import { ChevronDown } from "lucide-react";
import { useGetBranches } from "../../ReactQuery/Branch/GetBranch";
const BranchDropdown = () => {
  const { data: branches, isLoading, isError } = useGetBranches();
  console.log("HAHAH", branches);
  return (
    <div className="relative w-full sm:w-auto">
      <select
        className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
        disabled={isLoading || isError || !branches?.length}
      >
        {isLoading && <option>Loading...</option>}
        {isError && <option>Failed to load</option>}
        {!isLoading &&
          !isError &&
          branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
      />
    </div>
  );
};

export default BranchDropdown;
