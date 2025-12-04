// AssignSchedulebar.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Monitor,
  UsersRound,
} from "lucide-react";
import axios from "axios";
import { useGetInteractiveplaylist } from "../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import ScheduleTimingFields from "./ScheduleTimingFields";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { UpdateReservedBlockApi } from "../../API/API";
import { clearSelectedBlock } from "../../Redux/Block/BlockSlice";
import {
  selectSelectedBlock,
  setSelectedBlock,
  type Block,
} from "../../Redux/Block/BlockSlice";
import AssignNewModel from "./ScheduleItem/AssignNewModel";
// Bring ScheduleItem selectors & upsert action
import {
  addScheduleItemBlock,
  selectScheduleItemId,
  selectScheduleItemScreens,
  selectScheduleItemGroups,
} from "../../Redux/ScheduleItem/ScheduleItemSlice";
import {
  usePostSchedule,
  type SchedulePostPayload,
} from "../../Redux/Block/PostBlock";
import ErrorToast from "../../Components/ErrorToast";

/* -------------------------------- Types ---------------------------------- */
type Item = { id: number; name: string; duration?: number; media?: string };
type PickType = "normal" | "interactive";
type DeviceTab = "screens" | "groups";
type AssignSchedulebarProps = {
  onCancel?: () => void;
};

/* ------------------------------- Helpers --------------------------------- */
const fmtDuration = (secs?: number) => {
  if (!secs || secs <= 0) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const dd = (n: number) => String(n).padStart(2, "0");

// UI displays DD-MM-YYYY, block stores YYYY-MM-DD
const toDDMMYYYY = (d: Date) =>
  `${dd(d.getDate())}-${dd(d.getMonth() + 1)}-${d.getFullYear()}`;

const ymdToDmy = (ymd?: string) => {
  if (!ymd) return "";
  const [Y, M, D] = ymd.split("-");
  if (!Y || !M || !D) return "";
  return `${dd(Number(D))}-${dd(Number(M))}-${Y}`;
};

const dmyToYmd = (dmy?: string) => {
  if (!dmy) return "";
  const [D, M, Y] = dmy.split("-");
  if (!D || !M || !Y) return "";
  return `${Y}-${dd(Number(M))}-${dd(Number(D))}`;
};

export default function AssignSchedulebar({
  onCancel,
}: AssignSchedulebarProps) {
  const dispatch = useDispatch();

  /* ----------------------- Playlists (single select) ---------------------- */
  const {
    data: normalData,
    isLoading: loadingNormal,
    hasNextPage: normalHasNext,
    hasPreviousPage: normalHasPrev,
    fetchNextPage: fetchNextNormal,
    fetchPreviousPage: fetchPrevNormal,
    isFetchingNextPage: fetchingNextNormal,
    isFetchingPreviousPage: fetchingPrevNormal,
  } = useGetNormalPlaylist();

  const {
    data: interactiveData,
    isLoading: loadingInteractive,
    hasNextPage: interactiveHasNext,
    hasPreviousPage: interactiveHasPrev,
    fetchNextPage: fetchNextInteractive,
    fetchPreviousPage: fetchPrevInteractive,
    isFetchingNextPage: fetchingNextInteractive,
    isFetchingPreviousPage: fetchingPrevInteractive,
  } = useGetInteractiveplaylist();

  const [tab, setTab] = useState<PickType>("normal");
  const [uiError, setUiError] = useState<unknown | null>(null);
  const [selected, setSelected] = useState<{
    type: PickType;
    id: number;
  } | null>(null);

  const normals: Item[] = useMemo(
    () =>
      (normalData?.items ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        duration: p.duration,
        media: p.media,
      })),
    [normalData]
  );

  const interactives: Item[] = useMemo(
    () =>
      (interactiveData?.items ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        duration: p.duration,
        media: p.media,
      })),
    [interactiveData]
  );
  const list = tab === "normal" ? normals : interactives;
  const isLoadingPlaylists = loadingNormal || loadingInteractive;

  /* -------------------------- Block & Schedule Item ----------------------- */
  const selectedBlock = useSelector(selectSelectedBlock);
  const scheduleItemId = useSelector(selectScheduleItemId); // used for POST
  const allScreens = useSelector(selectScheduleItemScreens); // [{id,name}]
  const allGroups = useSelector(selectScheduleItemGroups); // [{id,name}]

  /* --------------------------- Timing (state) ----------------------------- */
  const todayStr = toDDMMYYYY(new Date());
  const [startDate, setStartDate] = useState<string>(todayStr); // DD-MM-YYYY
  const [endDate, setEndDate] = useState<string>(todayStr); // DD-MM-YYYY
  const [startTime, setStartTime] = useState<string>("00:00:00");
  const [endTime, setEndTime] = useState<string>("00:10:00");

  /* ------------------------ Devices (multi select) ------------------------ */
  const screens = useSelector((s: RootState) => s.ScheduleItem.screens);
  const groups = useSelector((s: RootState) => s.ScheduleItem.groups);
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("screens");
  const [selectedScreenIds, setSelectedScreenIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [assignMoreOpen, setAssignMoreOpen] = useState<boolean>(false); // ✅ add missing state

  /* ----------------------- Helper to patch the block ---------------------- */
  const patchBlock = useCallback(
    (partial: Partial<Block>) => {
      if (!selectedBlock) return;
      const next: Block = { ...selectedBlock, ...partial };
      dispatch(setSelectedBlock(next));
    },
    [dispatch, selectedBlock]
  );

  /* ------------------------- Prefill from block --------------------------- */
  // ------------------------- Prefill from block ---------------------------
  useEffect(() => {
    if (!selectedBlock) return;

    // timing from block (block is YYYY-MM-DD, we show DD-MM-YYYY)
    setStartDate(ymdToDmy(selectedBlock.start_day) || todayStr);
    setEndDate(
      ymdToDmy(selectedBlock.end_day || selectedBlock.start_day) || todayStr
    );
    setStartTime(selectedBlock.start_time || "00:00:00");
    setEndTime(selectedBlock.end_time || "00:10:00");

    // devices from block (يدعم الشكلين: {screenId} أو {id})
    const blockScreenIds = (selectedBlock.screens ?? []).map(
      (s: any) => s.screenId ?? s.id
    );
    const blockGroupIds = (selectedBlock.groups ?? []).map(
      (g: any) => g.groupId ?? g.id
    );

    setSelectedScreenIds(blockScreenIds);
    setSelectedGroupIds(blockGroupIds);
  }, [selectedBlock?.id]); // 🔥 انتبه: نعتمد على الـ id فقط

  // After playlists load, highlight the correct card + tab
  useEffect(() => {
    if (!selectedBlock?.playlistId) return;

    const pid = Number(selectedBlock.playlistId);
    const inNormal = normals.find((n) => Number(n.id) === pid);
    const inInteractive = interactives.find((n) => Number(n.id) === pid);

    if (inNormal) {
      setTab("normal");
      setSelected({ type: "normal", id: pid });
    } else if (inInteractive) {
      setTab("interactive");
      setSelected({ type: "interactive", id: pid });
    }
  }, [normals, interactives, selectedBlock?.playlistId]);

  /* -------------------------- Change handlers ---------------------------- */
  // Playlist
  const onPickPlaylist = (type: PickType, it: Item) => {
    setSelected({ type, id: it.id });
    patchBlock({ playlistId: it.id, playlistName: it.name });
  };

  // Times (convert to block’s YYYY-MM-DD; UI keeps DD-MM-YYYY)
  const onStartDateChange = (val: string) => {
    setStartDate(val);
    patchBlock({ start_day: dmyToYmd(val) });
  };
  const onEndDateChange = (val: string) => {
    setEndDate(val);
    patchBlock({ end_day: dmyToYmd(val) });
  };
  const onStartTimeChange = (val: string) => {
    setStartTime(val);
    patchBlock({ start_time: val });
  };
  const onEndTimeChange = (val: string) => {
    setEndTime(val);
    patchBlock({ end_time: val });
  };

  // Devices
  const toggleScreen = (id: number) => {
    // استخدم القيمة الحالية من الـ state (مش callback)
    const prev = selectedScreenIds;
    const next = prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id];

    // 1) حدّث الـ local state
    setSelectedScreenIds(next);

    // 2) حدّث الـ block عن طريق الـ dispatch
    patchBlock({
      screens: next.map((screenId) => ({ screenId })),
    });
  };

  const toggleGroup = (id: number) => {
    const prev = selectedGroupIds;
    const next = prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id];

    setSelectedGroupIds(next);

    patchBlock({
      groups: next.map((groupId) => ({ groupId })),
    });
  };

  /* --------------------------- Create vs Update --------------------------- */
  // local draft if id is a string and doesn’t start with "block-"
  const isLocalDraft =
    typeof selectedBlock?.id === "string" &&
    !String(selectedBlock.id).startsWith("block-");

  /* ----------------------------- Mutations -------------------------------- */
  const { mutateAsync: postSchedule, isPending: posting } = usePostSchedule({
    onSuccess: (data, vars) => {
      // Try to use returned object; if unknown, build an optimistic ScheduleBlock
      const created = buildScheduleBlockFromResponseOrLocal(
        data,
        selectedBlock,
        vars.payload,
        allScreens,
        allGroups
      );
      if (created) {
        // Insert into ScheduleItem slice so it appears in calendar/dev lists
        dispatch(addScheduleItemBlock(created));
      }
    },
    onError: (err) => {
      setUiError(err);
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const hasPlaylist = Boolean(selectedBlock?.playlistId);
  const hasDevices =
    selectedScreenIds.length > 0 ||
    selectedGroupIds.length > 0 ||
    (selectedBlock?.screens?.length ?? 0) > 0 ||
    (selectedBlock?.groups?.length ?? 0) > 0;

  const isApplyDisabled =
    submitting || posting || !selectedBlock || !hasPlaylist || !hasDevices;
  /* ------------------------------ Apply ---------------------------------- */
  const onApply = async () => {
    if (!selectedBlock) {
      console.warn("[Apply] No selected block.");
      return;
    }

    const finalScreens =
      selectedScreenIds.length > 0
        ? selectedScreenIds.map((id) => ({ screenId: id }))
        : selectedBlock.screens ?? [];
    const finalGroups =
      selectedGroupIds.length > 0
        ? selectedGroupIds.map((id) => ({ groupId: id }))
        : selectedBlock.groups ?? [];

    // required_without: at least one of groups or screens must be present
    if ((finalScreens?.length ?? 0) === 0 && (finalGroups?.length ?? 0) === 0) {
      console.warn(
        "[Apply] You must select at least one group or one screen to satisfy required_without."
      );
      return;
    }
    const safeStartDate =
      startDate || ymdToDmy(selectedBlock.start_day) || toDDMMYYYY(new Date());
    const safeEndDate =
      endDate ||
      ymdToDmy(selectedBlock.end_day || selectedBlock.start_day) ||
      safeStartDate;

    const safeStartTime = startTime || selectedBlock.start_time || "00:00:00";
    const safeEndTime = endTime || selectedBlock.end_time || "00:10:00";
    const payload: SchedulePostPayload = {
      playlistId: String(Number(selectedBlock.playlistId)), // or just String(...)
      groups: finalGroups,
      screens: finalScreens,
      startDate: safeStartDate,
      endDate: safeEndDate,
      startTime: safeStartTime,
      endTime: safeEndTime,
      title: "",
    };

    try {
      setSubmitting(true);

      if (isLocalDraft) {
        // CREATE (POST /schedule/:scheduleItemId)
        if (!scheduleItemId) {
          console.error("[POST] Missing scheduleItemId from ScheduleItemSlice");
          return;
        }

        await postSchedule({ scheduleItemId, payload });

        // Remove the local draft from calendar & close
        if (selectedBlock) {
          window.dispatchEvent(
            new CustomEvent("schedule/local-committed", {
              detail: { localId: String(selectedBlock.id) },
            })
          );
        }
        dispatch(clearSelectedBlock());
        onCancel?.(); // close drawer
        return; // done
      }

      // UPDATE (POST /reserved/:id)
      const token =
        (typeof window !== "undefined" && localStorage.getItem("token")) ||
        null;
      const id = String(selectedBlock.id).startsWith("block-")
        ? Number(String(selectedBlock.id).replace("block-", ""))
        : Number(selectedBlock.id);

      const url = `${UpdateReservedBlockApi}/${id}`;
      const { data } = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // ✅ normalize the server response into ScheduleBlock
      const updatedBlock = buildScheduleBlockFromResponseOrLocal(
        data,
        selectedBlock,
        payload,
        allScreens,
        allGroups,
        id // ensure we pin the updated id
      );

      // ✅ upsert (replace existing by id)
      if (updatedBlock) {
        dispatch(addScheduleItemBlock(updatedBlock));
      }

      // close & clear selection
      dispatch(clearSelectedBlock());
      onCancel?.();
    } catch (err) {
      setUiError(err); // ⬅️ show toast
      console.error("[Apply] error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* ====================== Playlists ====================== */}
        <div>
          <div className="mb-2 font-semibold text-sm text-gray-800">
            Pick a Playlist
          </div>

          <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden mb-5">
            <button
              onClick={() => setTab("normal")}
              className={`px-3 py-1.5 text-xs font-medium ${
                tab === "normal"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setTab("interactive")}
              className={`px-3 py-1.5 text-xs font-medium ${
                tab === "interactive"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Interactive
            </button>
          </div>

          {isLoadingPlaylists && (
            <div className="flex items-center gap-2 text-gray-600 p-3">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading playlists…</span>
            </div>
          )}

          {!isLoadingPlaylists && list.length === 0 && (
            <div className="p-4 text-center text-gray-500 border rounded-lg text-sm">
              No {tab} playlists found.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {list.map((it) => {
              const isSelected =
                selected?.id === it.id && selected?.type === tab;
              return (
                <button
                  key={`${tab}-${it.id}`}
                  onClick={() => onPickPlaylist(tab, it)}
                  className={`relative text-left rounded-lg border overflow-hidden group transition-all
                  ${
                    isSelected
                      ? "border-red-500 ring-2 ring-red-500/40"
                      : "border-gray-200 hover:shadow-sm"
                  }
                `}
                >
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {it.media ? (
                      <img
                        src={it.media}
                        alt={it.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="font-medium text-sm truncate">
                      {it.name}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Duration: {fmtDuration(it.duration)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {tab === "normal" && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-700">
              <span>
                Page {normalData?.currentPage ?? 1} /{" "}
                {normalData?.totalPages ?? 1}
              </span>

              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchPrevNormal()}
                  disabled={!normalHasPrev || fetchingPrevNormal}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => fetchNextNormal()}
                  disabled={!normalHasNext || fetchingNextNormal}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {tab === "interactive" && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-700">
              <span>
                Page {interactiveData?.currentPage ?? 1} /{" "}
                {interactiveData?.totalPages ?? 1}
              </span>

              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchPrevInteractive()}
                  disabled={!interactiveHasPrev || fetchingPrevInteractive}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => fetchNextInteractive()}
                  disabled={!interactiveHasNext || fetchingNextInteractive}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ====================== Timing ====================== */}
        <div>
          <ScheduleTimingFields
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
          />
        </div>

        {/* ====================== Devices ====================== */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold text-sm text-gray-800">
              Assign Devices
            </div>

            <button
              type="button"
              onClick={() => setAssignMoreOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium
                 border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Assign more devices
            </button>
          </div>
          <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden mb-3">
            <button
              onClick={() => setDeviceTab("screens")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                deviceTab === "screens"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <Monitor className="size-3.5" /> Screens
            </button>
            <button
              onClick={() => setDeviceTab("groups")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                deviceTab === "groups"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <UsersRound className="size-3.5" /> Groups
            </button>
          </div>

          <>
            {deviceTab === "screens" && (
              <>
                {screens.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border rounded-lg text-sm ">
                    No screens found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                    {screens.map((s) => {
                      const sid = Number(s.id);
                      const picked = selectedScreenIds.includes(sid);
                      return (
                        <button
                          key={`screen-${s.id}`}
                          onClick={() => toggleScreen(sid)}
                          className={`relative text-left rounded-lg border overflow-hidden transition-all
                          ${
                            picked
                              ? "border-red-500 ring-2 ring-red-500/40"
                              : "border-gray-200 hover:shadow-sm"
                          }
                        `}
                        >
                          <div className="aspect-[4/3] bg-gray-100 relative">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Monitor className="size-7" />
                            </div>

                            {picked && (
                              <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5">
                                <Check className="size-3" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="font-medium text-sm truncate">
                              {s.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {deviceTab === "groups" && (
              <>
                {groups.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border rounded-lg text-sm">
                    No groups found.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groups.map((g) => {
                      const gid = Number(g.id);
                      const picked = selectedGroupIds.includes(gid);
                      return (
                        <button
                          key={`group-${g.id}`}
                          onClick={() => toggleGroup(gid)}
                          className={`relative text-left rounded-lg border overflow-hidden transition-all
                          ${
                            picked
                              ? "border-red-500 ring-2 ring-red-500/40"
                              : "border-gray-200 hover:shadow-sm"
                          }
                        `}
                        >
                          <div className="aspect-[4/3] bg-gray-100 relative">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <UsersRound className="size-6" />
                            </div>

                            {picked && (
                              <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5">
                                <Check className="size-3" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="font-medium text-sm truncate">
                              {g.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        </div>

        {/* ====================== Footer Actions ====================== */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting || posting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={isApplyDisabled}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium
    ${
      isApplyDisabled
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : "bg-red-500 text-white hover:bg-red-600"
    }
  `}
          >
            {submitting || posting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {submitting || posting
              ? "Applying…"
              : isLocalDraft
              ? "Create"
              : "Apply"}
          </button>
        </div>

        <div className="my-10"></div>
      </div>

      {/* Device picker modal */}
      <AssignNewModel
        open={assignMoreOpen}
        onClose={() => setAssignMoreOpen(false)}
        primaryLabel="Apply"
      />
      {uiError && (
        <ErrorToast
          error={uiError}
          onClose={() => setUiError(null)}
          autoHideMs={8000}
          anchor="top-right"
        />
      )}
    </>
  );
}

/* ----------------------- Helpers to build ScheduleBlock -------------------- */

/**
 * Build a ScheduleBlock to insert into ScheduleItemSlice.
 * - Prefers `data.schedule` (the server envelope you showed).
 * - Avoids phantom group 0 when `group_ids` is "".
 * - Hardens mapping with known IDs and > 0 checks.
 */
function buildScheduleBlockFromResponseOrLocal(
  data: any,
  selectedBlock: Block | null | undefined,
  payload: SchedulePostPayload,
  allScreens: Array<{ id: number; name: string }>,
  allGroups: Array<{ id: number; name: string }>,
  explicitIdFromUpdate?: number
) {
  // Prefer envelope.data.schedule if present
  const schedule: any = data?.schedule ?? data;

  // Server ID (supports schedule.id or legacy blockId)
  const apiId: number | null =
    (schedule && (Number(schedule?.id) || Number(data?.blockId))) ??
    explicitIdFromUpdate ??
    null;

  // Known id sets to filter junk/stale ids
  const knownScreenIds = new Set<number>(
    (allScreens ?? [])
      .map((s) => Number(s.id))
      .filter((v): v is number => Number.isFinite(v))
  );
  const knownGroupIds = new Set<number>(
    (allGroups ?? [])
      .map((g) => Number(g.id))
      .filter((v): v is number => Number.isFinite(v))
  );

  // Hardened mappers
  const mapScreen = (id: number) => {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null as any;
    const found = allScreens.find((s) => Number(s.id) === n);
    return { id: n, name: found?.name ?? String(n) };
  };

  const mapGroup = (id: number) => {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null as any;
    const found = allGroups.find((g) => Number(g.id) === n);
    return { id: n, name: found?.name ?? String(n) };
  };

  // Screens from server (array of numbers)
  const serverScreenIds: number[] = Array.isArray(data?.attached_screen_ids)
    ? (data.attached_screen_ids as Array<number | string>)
        .map((val: number | string): number => Number(val))
        .filter(
          (num: number): num is number =>
            Number.isFinite(num) && num > 0 && knownScreenIds.has(num)
        )
    : [];

  // Groups from server: string of comma-separated ids OR array
  let serverGroupIds: number[] = [];
  if (typeof schedule?.group_ids === "string") {
    serverGroupIds = (schedule.group_ids as string)
      .split(",")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0) // drop blanks, avoids Number("") => 0
      .map((t: string): number => Number(t))
      .filter(
        (n: number): n is number =>
          Number.isFinite(n) && n > 0 && knownGroupIds.has(n)
      );
  } else if (Array.isArray(schedule?.group_ids)) {
    serverGroupIds = (schedule.group_ids as Array<number | string>)
      .map((v: number | string): number => Number(v))
      .filter(
        (n: number): n is number =>
          Number.isFinite(n) && n > 0 && knownGroupIds.has(n)
      );
  }

  if (apiId) {
    return {
      id: Number(apiId), // ✅ real backend id
      playlistId:
        Number(schedule?.playlist_id ?? schedule?.playlistId) ??
        Number(selectedBlock?.playlistId) ??
        Number(payload.playlistId),
      playlistName:
        schedule?.playlistName ?? selectedBlock?.playlistName ?? undefined,

      // accept either snake_case or camelCase from server
      start_day:
        schedule?.start_day ??
        schedule?.startDate ??
        (selectedBlock?.start_day ||
          (payload.startDate ? dmyToYmd(payload.startDate) : "")),
      start_time:
        schedule?.start_time ??
        schedule?.startTime ??
        (selectedBlock?.start_time || payload.startTime),
      end_day:
        schedule?.end_day ??
        schedule?.endDate ??
        (selectedBlock?.end_day ||
          (payload.endDate ? dmyToYmd(payload.endDate) : "")),
      end_time:
        schedule?.end_time ??
        schedule?.endTime ??
        (selectedBlock?.end_time || payload.endTime),

      // ✅ prefer server-resolved devices when present; else fall back to payload
      screens:
        (serverScreenIds.length
          ? serverScreenIds.map(mapScreen).filter(Boolean)
          : undefined) ??
        (payload.screens ?? [])
          .map((r) => mapScreen(Number(r.screenId)))
          .filter(Boolean),
      groups:
        (serverGroupIds.length
          ? serverGroupIds.map(mapGroup).filter(Boolean)
          : undefined) ??
        (payload.groups ?? [])
          .map((r) => mapGroup(Number(r.groupId)))
          .filter(Boolean),

      created_at: schedule?.created_at ?? selectedBlock?.created_at,
      updated_at: schedule?.updated_at ?? new Date().toISOString(),
    };
  }

  // Optimistic fallback when API doesn't give a full object
  if (selectedBlock) {
    return {
      id: Date.now(), // temporary optimistic id
      playlistId: Number(selectedBlock.playlistId ?? payload.playlistId),
      playlistName: selectedBlock.playlistName,
      start_day:
        selectedBlock.start_day ||
        (payload.startDate ? dmyToYmd(payload.startDate) : ""),
      start_time: selectedBlock.start_time || payload.startTime,
      end_day:
        selectedBlock.end_day ||
        (payload.endDate ? dmyToYmd(payload.endDate) : ""),
      end_time: selectedBlock.end_time || payload.endTime,
      screens: (payload.screens ?? [])
        .map((r) => mapScreen(Number(r.screenId)))
        .filter(Boolean),
      groups: (payload.groups ?? [])
        .map((r) => mapGroup(Number(r.groupId)))
        .filter(Boolean),
      created_at: selectedBlock.created_at,
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}
