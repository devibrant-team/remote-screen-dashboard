import React, { useMemo, useState } from "react";
import { ListVideo, Sparkles } from "lucide-react";

import InteractiveContent from "./Components/Contents/InteractiveContent";
import NormalContent from "./Components/Contents/NormalContent";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { useGetInteractiveplaylist } from "../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import ScheduledScreens from "./Components/Contents/ScheduledScreens";


type TabKey = "normal" | "interactive";

const ScheduleToolBar: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("normal");

  const { data: normalData, isLoading: loadingNormal } = useGetNormalPlaylist();
  const { data: interactiveData, isLoading: loadingInteractive } =
    useGetInteractiveplaylist();

  const normalCount = useMemo(() => normalData?.length ?? 0, [normalData]);
  const interactiveCount = useMemo(
    () => interactiveData?.length ?? 0,
    [interactiveData]
  );

  return (
    <div className="h-full min-h-0 flex flex-col space-y-3">
      {/* Header */}
      <div className="flex-shrink-0 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl text-red-600">
            <ListVideo size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Schedule content
            </div>
            <div className="text-[12px] text-gray-600">
              Tip: you can drop onto any time slot; duration is taken from the
              playlist.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center gap-2">
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
          <span className="ml-1 rounded-full bg-white px-2 py-[2px] text-xs text-gray-700 ring-1 ring-gray-200">
            {loadingNormal ? "…" : normalCount}
          </span>
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
          <span className="ml-1 rounded-full bg-white px-2 py-[2px] text-xs text-gray-700 ring-1 ring-gray-200">
            {loadingInteractive ? "…" : interactiveCount}
          </span>
        </button>
      </div>

      {/* Playlists card (own scroll if tall) */}
      <div className="flex-shrink-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[35vh] overflow-y-auto p-3">
          {tab === "normal" ? <NormalContent /> : <InteractiveContent />}
        </div>
      </div>

      {/* Scheduled screens: fills remaining height, scroll inside */}
      <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-full min-h-0 p-3">
          <ScheduledScreens />
        </div>
      </div>
    </div>
  );
};

export default ScheduleToolBar;
