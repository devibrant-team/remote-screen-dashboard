import { ChevronDown } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useGetGroups } from "../../ReactQuery/Group/GetGroup";
import { setScreenGroupId } from "../../Redux/AddScreen/AddScreenSlice";

const GroupDropdown: React.FC = () => {
  const { data: groups = [], isLoading, isError } = useGetGroups();
  const dispatch = useDispatch();
  const selectedGroupId = useSelector((s: RootState) => s.screenForm.groupId);

  // initialize once when groups arrive
  useEffect(() => {
    if (!selectedGroupId && groups.length) {
      dispatch(setScreenGroupId(String(groups[0].id)));
    }
  }, [selectedGroupId, groups, dispatch]);

  const value = useMemo(
    () => (selectedGroupId ? String(selectedGroupId) : ""),
    [selectedGroupId]
  );

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setScreenGroupId(e.target.value));
  };

  const disabled = (isLoading || isError) && groups.length === 0;

  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
      >
        {isLoading && <option>Loading...</option>}
        {isError && groups.length === 0 && <option>Failed to load</option>}
        {!isLoading &&
          groups.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name}
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

export default GroupDropdown;
