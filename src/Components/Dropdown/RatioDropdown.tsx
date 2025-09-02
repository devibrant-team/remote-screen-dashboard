// RatioDropdown.tsx
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useGetRatio } from "../../ReactQuery/Ratio/GetRatio";
import { setPlaylistRatio } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice"; // adjust path
import type { RatioRecord } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";

const RatioDropdown = () => {
  const { data: ratios, isLoading, isError } = useGetRatio();
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.playlist.selectedRatio);

  // Initialize once data arrives
  useEffect(() => {
    if (!selected && ratios?.length) {
      const first = ratios[0] as RatioRecord;
      dispatch(setPlaylistRatio(first));
    }
  }, [selected, ratios, dispatch]);

  const selectedId = selected ? String(selected.id) : "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const rec = ratios?.find((r) => r.id === id);
    if (rec) dispatch(setPlaylistRatio(rec as RatioRecord));
  };

  return (
    <div className="relative w-full">
      <select
        value={selectedId}
        onChange={handleChange}
        className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
        disabled={isLoading || isError || !ratios?.length}
      >
        {isLoading && <option>Loading...</option>}
        {isError && <option>Failed to load</option>}
        {!isLoading &&
          !isError &&
          ratios?.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.ratio}
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

export default RatioDropdown;
