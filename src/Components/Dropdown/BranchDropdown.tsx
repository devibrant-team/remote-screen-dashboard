import { ChevronDown } from "lucide-react";
import { useGetBranches } from "../../ReactQuery/Branch/GetBranch";
import { setSelectedBranchId } from "../../Redux/ScreenManagement/ScreenManagementSlice";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useEffect, useMemo } from "react";
const BranchDropdown = () => {
  const { data: branches, isLoading, isError } = useGetBranches();
  const selectedBranchId = useSelector(
    (s: RootState) => s.screenManagement.selectedBranchId
  );
  console.log("Branch", selectedBranchId);
  const dispatch = useDispatch();
  // initialize once when groups arrive
  useEffect(() => {
    if (!selectedBranchId && branches?.length) {
      dispatch(setSelectedBranchId(String(branches[0].id)));
    }
  }, [selectedBranchId, branches, dispatch]);

  const value = useMemo(
    () => (selectedBranchId ? String(selectedBranchId) : ""),
    [selectedBranchId]
  );

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSelectedBranchId(e.target.value));
  };

  const disabled = (isLoading || isError) && branches?.length === 0;

  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
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
