// ScheduleToolBar.tsx
import React, { useMemo, useRef, useState } from "react";
import { ListVideo, Sparkles, ArrowLeft } from "lucide-react";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { useGetInteractiveplaylist } from "../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import ScheduleScreen from "./ScheduleScreen";
import { useExternalDraggable } from "../../Components/useExternalDraggable";
import NormalContent from "./Content/NormalContent";
import InteractiveContent from "./Content/InteractiveContent";
import { useNavigate } from "react-router-dom"; // ⬅️ add this

type TabKey = "normal" | "interactive";

const ScheduleToolBar: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("normal");
  const listRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate(); // ⬅️ hook

  const { data: normalData, isLoading: loadingNormal } = useGetNormalPlaylist();
  const { data: interactiveData, isLoading: loadingInteractive } =
    useGetInteractiveplaylist();

  const normalCount = useMemo(() => normalData?.length ?? 0, [normalData]);
  const interactiveCount = useMemo(
    () => interactiveData?.length ?? 0,
    [interactiveData]
  );

  useExternalDraggable(listRef, ".fc-draggable");

  return (
    <div className="h-full min-h-0 flex flex-col space-y-3">
      {/* Header row with Back + Tabs */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* ⬅️ Back button */}
        <button
          type="button"
          onClick={() => navigate("/schedule")}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="Back to schedules"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => setTab("normal")}
          className={
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition " +
            (tab === "normal"
              ? "border-red-500 bg-red-50 text-red-700 shadow-[inset_0_0_0_1px_rgba(239,68,68,.15)]"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
          }
        >
          <ListVideo size={16} />
          Normal
        </button>

        <button
          type="button"
          onClick={() => setTab("interactive")}
          className={
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition " +
            (tab === "interactive"
              ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,.15)]"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
          }
        >
          <Sparkles size={16} />
          Interactive
        </button>
      </div>

      {/* Playlists */}
      <div className="flex-shrink-0 rounded-2xl border border-gray-200 bg-white shadow-sm scrollbar-hide">
        <div
          ref={listRef}
          className="max-h-[35vh] overflow-y-auto p-3 scrollbar-hide overscroll-contain"
        >
          {tab === "normal" ? <NormalContent /> : <InteractiveContent />}
        </div>
      </div>

      <div className="scrollbar-hide overscroll-contain">
        <ScheduleScreen />
      </div>
    </div>
  );
};

export default ScheduleToolBar;
