// components/Shared/DurationInput.tsx

import { useDispatch, useSelector } from "react-redux";
import { setDuration } from "../../../../Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import type { RootState } from "../../../../../store";

const DurationInput = () => {
  const dispatch = useDispatch();
  const duration = useSelector((state: RootState) => state.normalplaylist.duration);

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        ⏱ Duration (in seconds)
      </label>
      <input
        type="number"
        min={1}
        value={duration}
        onChange={(e) => dispatch(setDuration(Number(e.target.value)))}
        className="w-28 p-2 border rounded-md text-sm shadow-sm focus:ring focus:ring-red-400"
        placeholder="e.g. 10"
      />
    </div>
  );
};

export default DurationInput;
