import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Monitor,
  UsersRound,
} from "lucide-react";
import axios from "axios";
import { useGetInteractiveplaylist } from "../../../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import { useGetNormalPlaylist } from "../../../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import ScheduleTimingFields from "../../ScheduleTimingFields";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../../store";
import { UpdateReservedBlockApi } from "../../../../API/API";

import {
  clearSelectedBlock,
  selectSelectedBlock,
  setSelectedBlock,
  type Block,
} from "../../../../Redux/Block/BlockSlice";

import {
  selectScheduleItemId,
  addScheduleItemBlock,
} from "../../../../Redux/ScheduleItem/ScheduleItemSlice";

import {
  usePostSchedule,
  type SchedulePostPayload,
} from "../../../../Redux/Block/PostBlock";

import ErrorToast from "../../../../Components/ErrorToast";

import {
  upsertMany as upsertReservedMany,
  type ReservedBlock,
  type Named as DeviceNamed,
} from "../../../../Redux/ReservedBlocks/ReservedBlocks";
import ReservedAssignNewModel from "./ReservedAssignNewModel";
import { useAlertDialog } from "@/AlertDialogContext";

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

// Treat anything *not* numeric and *not* "block-<num>" as a local draft
const isPersistedId = (id: unknown) => {
  if (id == null) return false;
  const s = String(id);
  const num = Number(s);
  if (Number.isFinite(num)) return true;
  return s.startsWith("block-");
};

// ---- time helpers ----
const toIsoDate = (dmyOrYmd?: string) => {
  if (!dmyOrYmd) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dmyOrYmd)) return dmyToYmd(dmyOrYmd);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dmyOrYmd)) return dmyOrYmd;
  return "";
};

const toDateTime = (dateYmd?: string, time?: string) => {
  if (!dateYmd || !time) return null;
  const t = /^\d{2}:\d{2}(:\d{2})?$/.test(time)
    ? time.length === 5
      ? `${time}:00`
      : time
    : "00:00:00";
  const d = new Date(`${dateYmd}T${t}`);
  return isNaN(d.getTime()) ? null : d;
};

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

/* -------- Reserved -> ScheduleBlock mapper (for the "normal" calendar) --- */
function scheduleBlockFromReserved(
  rb: ReservedBlock,
  titleOverride?: string
): any /* ScheduleBlock */ {
  const toYYYYMMDD = (s?: string) =>
    typeof s === "string" && s.includes("-") ? s : undefined;

  const effectiveTitle =
    titleOverride ??
    rb.title ??
    rb.scheduleItemName ??
    (rb.playlistId ? `Playlist #${rb.playlistId}` : "Block");

  return {
    id: Number(rb.id),
    title: effectiveTitle,
    start_day: toYYYYMMDD(rb.startDate),
    end_day: toYYYYMMDD(rb.endDate ?? rb.startDate),
    start_time: rb.startTime ?? "00:00:00",
    end_time: rb.endTime ?? "00:10:00",
    screens: (rb.screens ?? []).map((s) => ({
      id: Number(s.id),
      name: s.name ?? "",
    })),
    groups: (rb.groups ?? []).map((g) => ({
      id: Number(g.id),
      name: g.name ?? "",
    })),
    playlistId: rb.playlistId,
    persisted: true,
    playlistName: titleOverride ?? rb.title,
  };
}

function scheduleBlockFromApiSchedule(
  schedule: {
    id?: number | string;
    playlist_id?: number | string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    groups?: Array<{ groupId?: number | string }>;
    screens?: Array<{ screenId?: number | string }>;
  },
  devices: { screens: DeviceNamed[]; groups: DeviceNamed[] },
  titleOverride?: string
): any /* ScheduleBlock */ {
  const id = Number(schedule?.id);
  const playlistId = Number(schedule?.playlist_id);

  const pickName = (list: DeviceNamed[], idNum: number, prefix: string) =>
    list.find((x) => Number(x.id) === idNum)?.name ?? `${prefix} #${idNum}`;

  const screenIds: number[] = Array.isArray(schedule?.screens)
    ? schedule!
        .screens!.map((s) => Number(s?.screenId))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const groupIds: number[] = Array.isArray(schedule?.groups)
    ? schedule!
        .groups!.map((g) => Number(g?.groupId))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  return {
    id,
    title:
      titleOverride ??
      (Number.isFinite(playlistId) ? `Playlist #${playlistId}` : "Block"),
    start_day: schedule?.startDate,
    end_day: schedule?.endDate ?? schedule?.startDate,
    start_time: schedule?.startTime ?? "00:00:00",
    end_time: schedule?.endTime ?? schedule?.endTime ?? "00:10:00",
    screens: screenIds.map((n) => ({
      id: n,
      name: pickName(devices.screens, n, "Screen"),
    })),
    groups: groupIds.map((n) => ({
      id: n,
      name: pickName(devices.groups, n, "Group"),
    })),
    playlistId,
    persisted: true,
    playlistName: titleOverride,
  };
}

/* ---------------------- Reserved mapper (server/payload) ------------------ */
function toReservedFromResponseOrPayload(
  data: any,
  fallbackId: number | null,
  payload: SchedulePostPayload,
  devices: {
    screens: DeviceNamed[];
    groups: DeviceNamed[];
  }
): ReservedBlock | null {
  const schedule = data?.schedule ?? data ?? {};
  const id =
    Number(schedule?.id) ||
    Number(schedule?.blockId) ||
    (fallbackId != null ? Number(fallbackId) : NaN);

  if (!Number.isFinite(id)) return null;

  const pickName = (list: DeviceNamed[], idNum: number, prefix: string) =>
    list.find((x) => Number(x.id) === idNum)?.name ?? `${prefix} #${idNum}`;

  const playlistId =
    Number(schedule?.playlist_id ?? schedule?.playlistId) ||
    Number(payload.playlistId) ||
    undefined;

  const sDate =
    schedule?.startDate ??
    schedule?.start_day ??
    (payload.startDate ? dmyToYmd(payload.startDate) : undefined);

  const eDate =
    schedule?.endDate ??
    schedule?.end_day ??
    (payload.endDate ? dmyToYmd(payload.endDate) : undefined);

  const sTime =
    schedule?.startTime ?? schedule?.start_time ?? payload.startTime;
  const eTime = schedule?.endTime ?? schedule?.end_time ?? payload.endTime;

  const serverScreenIds: number[] = Array.isArray(data?.attached_screen_ids)
    ? (data.attached_screen_ids as Array<number | string>)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const outScreens: DeviceNamed[] = (
    serverScreenIds.length
      ? serverScreenIds
      : (payload.screens ?? []).map((r) => Number(r.screenId))
  )
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => ({ id: n, name: pickName(devices.screens, n, "Screen") }));

  let serverGroupIds: number[] = [];
  if (typeof schedule?.group_ids === "string") {
    serverGroupIds = (schedule.group_ids as string)
      .split(",")
      .map((t: string) => Number(t.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  } else if (Array.isArray(schedule?.group_ids)) {
    serverGroupIds = (schedule.group_ids as Array<number | string>)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  const outGroups: DeviceNamed[] = (
    serverGroupIds.length
      ? serverGroupIds
      : (payload.groups ?? []).map((r) => Number(r.groupId))
  )
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => ({ id: n, name: pickName(devices.groups, n, "Group") }));

  const title =
    schedule?.title ??
    schedule?.playlistName ??
    (Number.isFinite(playlistId) ? `Playlist #${playlistId}` : undefined);

  const scheduleItemName =
    schedule?.scheduleItem ??
    schedule?.schedule_item_name ??
    schedule?.scheduleItemName ??
    undefined;

  return {
    id,
    title,
    scheduleItemName,
    playlistId: playlistId ?? undefined,
    startDate:
      typeof sDate === "string" && sDate.includes("-") ? sDate : undefined,
    endDate:
      typeof eDate === "string" && eDate.includes("-") ? eDate : undefined,
    startTime: sTime,
    endTime: eTime,
    screens: outScreens,
    groups: outGroups,
  };
}

export default function ReservedAssignSchedulebar({
  onCancel,
}: AssignSchedulebarProps) {
  const dispatch = useDispatch();

  /* ----------------------- Playlists (single select) ---------------------- */
  const { data: normalData, isLoading: loadingNormal } = useGetNormalPlaylist();
  const { data: interactiveData, isLoading: loadingInteractive } =
    useGetInteractiveplaylist();

  const [tab, setTab] = useState<PickType>("normal");
  const [uiError, setUiError] = useState<unknown | null>(null);
  const [selected, setSelected] = useState<{
    type: PickType;
    id: number;
  } | null>(null);

  const normals: Item[] = useMemo(
    () => (Array.isArray(normalData) ? normalData : []),
    [normalData]
  );
  const interactives: Item[] = useMemo(
    () => (Array.isArray(interactiveData) ? interactiveData : []),
    [interactiveData]
  );

  const list = tab === "normal" ? normals : interactives;
  const isLoadingPlaylists = loadingNormal || loadingInteractive;

  /* -------------------------- Block & Schedule Item ----------------------- */
  const selectedBlock = useSelector(selectSelectedBlock);
  const scheduleItemId = useSelector(selectScheduleItemId);

  const allScreens = useSelector(
    (s: RootState) => s.ReservedBlocks.selectedScreens
  ) as DeviceNamed[];
  const allGroups = useSelector(
    (s: RootState) => s.ReservedBlocks.selectedGroups
  ) as DeviceNamed[];

  // All reserved items to detect conflicts
  const reservedItems = useSelector(
    (s: RootState) => s.ReservedBlocks.items
  ) as ReservedBlock[];

  /* --------------------------- Timing (state) ----------------------------- */
  const todayStr = toDDMMYYYY(new Date());
  const [startDate, setStartDate] = useState<string>(todayStr); // DD-MM-YYYY
  const [endDate, setEndDate] = useState<string>(todayStr); // DD-MM-YYYY
  const [startTime, setStartTime] = useState<string>("00:00:00");
  const [endTime, setEndTime] = useState<string>("00:10:00");

  /* ------------------------ Devices (multi select) ------------------------ */
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("screens");
  const [selectedScreenIds, setSelectedScreenIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [assignMoreOpen, setAssignMoreOpen] = useState<boolean>(false);
  const alert = useAlertDialog();
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
  useEffect(() => {
    if (!selectedBlock) return;

    // If playlistId is picked, set the tab + selected card & keep the name
    const pidNum = selectedBlock.playlistId
      ? Number(selectedBlock.playlistId)
      : NaN;
    if (Number.isFinite(pidNum)) {
      const inNormal = normals.find((n) => Number(n.id) === pidNum);
      const inInteractive = interactives.find((n) => Number(n.id) === pidNum);
      if (inNormal) {
        setTab("normal");
        setSelected({ type: "normal", id: pidNum });
      } else if (inInteractive) {
        setTab("interactive");
        setSelected({ type: "interactive", id: pidNum });
      }
    }

    setStartDate(ymdToDmy(selectedBlock.start_day) || todayStr);
    setEndDate(
      ymdToDmy(selectedBlock.end_day || selectedBlock.start_day) || todayStr
    );
    setStartTime(selectedBlock.start_time || "00:00:00");
    setEndTime(selectedBlock.end_time || "00:10:00");

    setSelectedScreenIds((selectedBlock.screens ?? []).map((s) => s.screenId));
    setSelectedGroupIds((selectedBlock.groups ?? []).map((g) => g.groupId));
  }, [selectedBlock, normals, interactives]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -------------------------- Change handlers ---------------------------- */
  const onPickPlaylist = (type: PickType, it: Item) => {
    setSelected({ type, id: it.id });
    patchBlock({ playlistId: it.id, playlistName: it.name });
  };
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

  const toggleScreen = (id: number) => {
    setSelectedScreenIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      patchBlock({ screens: next.map((n) => ({ screenId: n })) });
      return next;
    });
  };
  const toggleGroup = (id: number) => {
    setSelectedGroupIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      patchBlock({ groups: next.map((n) => ({ groupId: n })) });
      return next;
    });
  };

  /* --------------------------- Create vs Update --------------------------- */
  const persisted = isPersistedId(selectedBlock?.id);
  const isLocalDraft = !persisted;

  /* ----------------------- Candidate interval ----------------------------- */
  const candidate = useMemo(() => {
    const sDateYmd =
      toIsoDate(startDate) || selectedBlock?.start_day || undefined;
    const eDateYmd =
      toIsoDate(endDate) ||
      selectedBlock?.end_day ||
      selectedBlock?.start_day ||
      undefined;
    const sTime = startTime || selectedBlock?.start_time || "00:00:00";
    const eTime = endTime || selectedBlock?.end_time || "00:10:00";

    const start = toDateTime(sDateYmd, sTime);
    const end = toDateTime(eDateYmd, eTime);

    if (!start || !end || !(end > start)) return null;
    return { start, end };
  }, [startDate, endDate, startTime, endTime, selectedBlock]);

  /* -------------------- Conflicting screens set --------------------------- */
  const conflictingScreenIds = useMemo(() => {
    if (!candidate) return new Set<number>();

    const currentId =
      selectedBlock?.id != null
        ? String(selectedBlock.id).startsWith("block-")
          ? Number(String(selectedBlock.id).replace("block-", ""))
          : Number(selectedBlock.id)
        : NaN;

    const out = new Set<number>();

    for (const rb of reservedItems) {
      const rbId = Number(rb.id);
      if (
        Number.isFinite(currentId) &&
        Number.isFinite(rbId) &&
        rbId === currentId
      ) {
        continue; // skip self
      }

      const sY = rb.startDate; // stored as YYYY-MM-DD
      const eY = rb.endDate ?? rb.startDate;
      const sT = rb.startTime ?? "00:00:00";
      const eT = rb.endTime ?? "00:10:00";

      const rbStart = toDateTime(sY, sT);
      const rbEnd = toDateTime(eY, eT);
      if (!rbStart || !rbEnd || !(rbEnd > rbStart)) continue;

      if (overlaps(candidate.start, candidate.end, rbStart, rbEnd)) {
        for (const s of rb.screens ?? []) {
          const sid = Number(s.id);
          if (Number.isFinite(sid)) out.add(sid);
        }
      }
    }

    return out;
  }, [candidate, reservedItems, selectedBlock?.id]);

  /* -------------------- Conflicting groups set (NEW) ---------------------- */
  const conflictingGroupIds = useMemo(() => {
    if (!candidate) return new Set<number>();

    const currentId =
      selectedBlock?.id != null
        ? String(selectedBlock.id).startsWith("block-")
          ? Number(String(selectedBlock.id).replace("block-", ""))
          : Number(selectedBlock.id)
        : NaN;

    const out = new Set<number>();

    for (const rb of reservedItems) {
      const rbId = Number(rb.id);
      if (
        Number.isFinite(currentId) &&
        Number.isFinite(rbId) &&
        rbId === currentId
      ) {
        continue; // skip self
      }

      const sY = rb.startDate;
      const eY = rb.endDate ?? rb.startDate;
      const sT = rb.startTime ?? "00:00:00";
      const eT = rb.endTime ?? "00:10:00";

      const rbStart = toDateTime(sY, sT);
      const rbEnd = toDateTime(eY, eT);
      if (!rbStart || !rbEnd || !(rbEnd > rbStart)) continue;

      if (overlaps(candidate.start, candidate.end, rbStart, rbEnd)) {
        for (const g of rb.groups ?? []) {
          const gid = Number(g.id);
          if (Number.isFinite(gid)) out.add(gid);
        }
      }
    }

    return out;
  }, [candidate, reservedItems, selectedBlock?.id]);

  /* ----------------------------- Mutations -------------------------------- */
  const { mutateAsync: postSchedule, isPending: posting } = usePostSchedule({
    onSuccess: (data, vars) => {
      const rb = toReservedFromResponseOrPayload(data, null, vars.payload, {
        screens: allScreens,
        groups: allGroups,
      });

      const localId = selectedBlock ? String(selectedBlock.id) : null;

      const apiSchedule = (data as any)?.schedule ?? (data as any) ?? {};
      const titleOverride = selectedBlock?.playlistName;
      const sbFromApi = scheduleBlockFromApiSchedule(
        apiSchedule,
        { screens: allScreens, groups: allGroups },
        titleOverride
      );

      if (rb) {
        dispatch(upsertReservedMany([rb]));
        const titleOverride2 = selectedBlock?.playlistName;
        dispatch(
          addScheduleItemBlock(scheduleBlockFromReserved(rb, titleOverride2))
        );

        window.dispatchEvent(
          new CustomEvent("schedule/mark-persisted", {
            detail: { id: String(rb.id), persisted: true },
          })
        );
      }
      if (sbFromApi?.id) dispatch(addScheduleItemBlock(sbFromApi));

      if (localId) {
        window.dispatchEvent(
          new CustomEvent("schedule/replace-local", {
            detail: {
              localId,
              newId: String(sbFromApi?.id ?? rb?.id),
              persisted: true,
              reservedBlock: rb,
            },
          })
        );
      }

      dispatch(clearSelectedBlock());
      onCancel?.();
    },
    onError: (err) => setUiError(err),
  });

  const [submitting, setSubmitting] = useState(false);

  /* -------------------------------- Apply --------------------------------- */
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

    const hasAnyDevice =
      (finalScreens?.length ?? 0) > 0 || (finalGroups?.length ?? 0) > 0;

    const missingPlaylist =
      !selectedBlock.playlistId ||
      !Number.isFinite(Number(selectedBlock.playlistId));

    if (missingPlaylist && !hasAnyDevice) {
      await alert({
        title: "Playlist and devices required",
        message:
          "Please select a playlist and at least one screen or group before applying.",
        buttonText: "OK",
      });
      return;
    }
    if (missingPlaylist) {
      await alert({
        title: "Playlist required",
        message: "Please select a playlist before applying this block.",
        buttonText: "OK",
      });
      return;
      return;
    }
    if (!hasAnyDevice) {
      await alert({
        title: "No devices selected",
        message: "Please select at least one screen or one group.",
        buttonText: "OK",
      });
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
      playlistId: String(Number(selectedBlock.playlistId)),
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
        if (!scheduleItemId) {
          console.error("[POST] Missing scheduleItemId from ScheduleItemSlice");
          setSubmitting(false);
          return;
        }

        await postSchedule({
          scheduleItemId: Number(scheduleItemId),
          payload,
        });

        return;
      }

      const token =
        (typeof window !== "undefined" && localStorage.getItem("token")) ||
        null;

      const idNum = String(selectedBlock.id).startsWith("block-")
        ? Number(String(selectedBlock.id).replace("block-", ""))
        : Number(selectedBlock.id);

      const url = `${UpdateReservedBlockApi}/${idNum}`;
      const { data } = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const rb = toReservedFromResponseOrPayload(data, idNum, payload, {
        screens: allScreens,
        groups: allGroups,
      });
      if (rb) {
        const titleOverride = selectedBlock?.playlistName;
        dispatch(upsertReservedMany([rb]));
        dispatch(
          addScheduleItemBlock(scheduleBlockFromReserved(rb, titleOverride))
        );

        window.dispatchEvent(
          new CustomEvent("schedule/mark-persisted", {
            detail: { id: String(rb.id), persisted: true },
          })
        );
      }

      dispatch(clearSelectedBlock());
      onCancel?.();
    } catch (err) {
      setUiError(err);
      console.error("[Apply] error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------- Render -------------------------------- */
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
              const isSel = selected?.id === it.id && selected?.type === tab;
              return (
                <button
                  key={`${tab}-${it.id}`}
                  onClick={() => onPickPlaylist(tab, it)}
                  className={`relative text-left rounded-lg border overflow-hidden group transition-all
                  ${
                    isSel
                      ? "border-red-500 ring-2 ring-red-500/40"
                      : "border-gray-200 hover:shadow-sm"
                  }`}
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
                    {isSel && (
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
            {/* Screens */}
            {deviceTab === "screens" && (
              <>
                {allScreens.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border rounded-lg text-sm ">
                    No screens found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                    {allScreens.map((s) => {
                      const sid = Number(s.id);
                      const picked = selectedScreenIds.includes(sid);
                      const hasConflict = conflictingScreenIds.has(sid);
                      return (
                        <button
                          key={`screen-${s.id}`}
                          onClick={() => !hasConflict && toggleScreen(sid)}
                          disabled={hasConflict}
                          className={`relative text-left rounded-lg border overflow-hidden transition-all
                          ${
                            picked
                              ? "border-red-500 ring-2 ring-red-500/40"
                              : "border-gray-200 hover:shadow-sm"
                          }
                          ${
                            hasConflict ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                          title={
                            hasConflict
                              ? "Conflicts with another block in this time range"
                              : undefined
                          }
                        >
                          <div className="aspect-[4/3] bg-gray-100 relative">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Monitor className="size-7" />
                            </div>
                            {picked && !hasConflict && (
                              <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5">
                                <Check className="size-3" />
                              </div>
                            )}
                            {hasConflict && (
                              <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                                Conflict
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              {s.name}
                              {hasConflict && (
                                <span className="text-[10px] text-red-600 font-medium">
                                  (conflict)
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Groups */}
            {deviceTab === "groups" && (
              <>
                {allGroups.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border rounded-lg text-sm">
                    No groups found.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allGroups.map((g) => {
                      const gid = Number(g.id);
                      const picked = selectedGroupIds.includes(gid);
                      const hasConflict = conflictingGroupIds.has(gid);
                      return (
                        <button
                          key={`group-${g.id}`}
                          onClick={() => !hasConflict && toggleGroup(gid)}
                          disabled={hasConflict}
                          className={`relative text-left rounded-lg border overflow-hidden transition-all
                          ${
                            picked
                              ? "border-red-500 ring-2 ring-red-500/40"
                              : "border-gray-200 hover:shadow-sm"
                          }
                          ${
                            hasConflict ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                          title={
                            hasConflict
                              ? "Conflicts with another block in this time range"
                              : undefined
                          }
                        >
                          <div className="aspect-[4/3] bg-gray-100 relative">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <UsersRound className="size-6" />
                            </div>
                            {picked && !hasConflict && (
                              <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5">
                                <Check className="size-3" />
                              </div>
                            )}
                            {hasConflict && (
                              <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                                Conflict
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              {g.name}
                              {hasConflict && (
                                <span className="text-[10px] text-red-600 font-medium">
                                  (conflict)
                                </span>
                              )}
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
            disabled={submitting || posting}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium
            ${
              submitting || posting
                ? "bg-gray-300 text-gray-600"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
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
      <ReservedAssignNewModel
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
