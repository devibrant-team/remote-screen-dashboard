import React, { useMemo, useState } from "react";
import { ListVideo, Sparkles, ArrowLeft } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import InteractiveContent from "./Components/Contents/InteractiveContent";
import NormalContent from "./Components/Contents/NormalContent";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { useGetInteractiveplaylist } from "../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import ScheduledScreens from "./Components/Contents/ScheduledScreens";
import { selectAllScheduleItems } from "../../Redux/Schedule/ScheduleSelectors";
import { removeItem } from "../../Redux/Schedule/SheduleSlice";
import type { RootState } from "../../../store";


type TabKey = "normal" | "interactive";

const ScheduleToolBar: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("normal");
  const navigate = useNavigate();
  const dispatch = useDispatch();
const scheduleItemName = useSelector((s:RootState)=>s.schedule.currentName)
console.log("HEHE",scheduleItemName)
  const { data: normalData, isLoading: loadingNormal } = useGetNormalPlaylist();
  const { data: interactiveData, isLoading: loadingInteractive } =
    useGetInteractiveplaylist();

  const normalCount = useMemo(() => normalData?.length ?? 0, [normalData]);
  const interactiveCount = useMemo(
    () => interactiveData?.length ?? 0,
    [interactiveData]
  );

  // ⬇️ drafts from Redux
  const drafts = useSelector(selectAllScheduleItems) as Array<{ id: string }> | undefined;
  const hasReduxDrafts = (drafts?.length ?? 0) > 0;

  // ⬇️ optional local cache keys (rename to your actual keys)
  const LOCAL_KEYS = ["drogo-schedule-drafts", "scheduleDrafts"];
  const hasLocalDrafts = LOCAL_KEYS.some((k) => !!localStorage.getItem(k));

  const hasUnsaved = hasReduxDrafts || hasLocalDrafts;

  const clearUnsaved = () => {
    // remove all draft items from Redux
    for (const d of drafts ?? []) {
      if (d?.id) dispatch(removeItem({ id: d.id }));
    }
    // clear local cached drafts if you use them
    for (const k of LOCAL_KEYS) localStorage.removeItem(k);
  };

  const handleBack = () => {
    if (hasUnsaved) {
      const ok = window.confirm(
        "You have unsaved schedule changes. Leaving will discard them. Continue?"
      );
      if (!ok) return;
      clearUnsaved();
    }
    // go back; or replace with navigate("/schedule") if you want a hard route
    navigate(-1);
  };

  return (
    <div className="h-full min-h-0 flex flex-col space-y-3">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1>{scheduleItemName}</h1>
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

      {/* Playlists */}
      <div className="flex-shrink-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[35vh] overflow-y-auto p-3">
          {tab === "normal" ? <NormalContent /> : <InteractiveContent />}
        </div>
      </div>

      {/* Scheduled screens */}
      <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-full min-h-0 p-3">
          <ScheduledScreens />
        </div>
      </div>
    </div>
  );
};

export default ScheduleToolBar;
