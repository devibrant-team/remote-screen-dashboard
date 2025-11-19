import { useDispatch, useSelector } from "react-redux";
import { useMemo } from "react";
import { useGetBranches } from "../../ReactQuery/Branch/GetBranch";
import { setFilterScreenAcctoBranchId } from "../../Redux/ScreenManagement/ScreenManagementSlice";
import type { RootState } from "../../../store";
import type { AppSelectOption } from "./CustomDropdown";
import CustomDropdown from "./CustomDropdown";

const FilterBranchDropdown = () => {
  const { data: branches, isLoading, isError } = useGetBranches();

  // 🔴 use FilterScreenAcctoBranchId (the one you set)
  const filterBranchId = useSelector(
    (s: RootState) => s.screenManagement.FilterScreenAcctoBranchId
  );

  const dispatch = useDispatch();

  // control value from the same field
  const value = filterBranchId ? String(filterBranchId) : "";

  const disabled = (isLoading || isError) && branches?.length === 0;

  const options: AppSelectOption[] = useMemo(() => {
    const base: AppSelectOption[] = [{ value: "", label: "All branches" }];

    if (!branches || branches.length === 0) return base;

    return base.concat(
      branches.map((b) => ({
        value: String(b.id),
        label: b.name,
      }))
    );
  }, [branches]);

  const handleChange = (val: string) => {
    dispatch(setFilterScreenAcctoBranchId(val || ""));
  };

  const errorText = isError ? "Failed to load branches" : undefined;

  return (
    <div className="w-full flex-1">
      <CustomDropdown
        value={value}
        onChange={handleChange}
        options={options}
        placeholder={isLoading ? "Loading branches…" : "--- All branches ---"}
        disabled={disabled}
        loading={isLoading}
        error={errorText}
      />
    </div>
  );
};

export default FilterBranchDropdown;
