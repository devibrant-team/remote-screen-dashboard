import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Monitor, UsersRound, AlertTriangle, Plus } from "lucide-react";

import {
  addGroupToItem,
  addScreenToItem,
  removeGroupFromItem,
  removeScreenFromItem,
  setItemPlaylist,
  setItemTitle,
  removeItem,
} from "../../../Redux/Schedule/SheduleSlice";

import { selectSelectedDevices } from "../../../Redux/ScreenManagement/ScreenSlice";
import { selectSelectedGroups } from "../../../Redux/ScreenManagement/GroupSlice";
import type { RootState } from "../../../../store";

import {
  upsertMany,
  selectAllReservedBlocks,
  type ReservedBlock,
} from "../../../Redux/Schedule/ReservedBlocks/ReservedBlockSlice";

import PlaylistPicker from "./PlaylistPicker";
import { selectScheduleItemById } from "../../../Redux/Schedule/ScheduleSelectors";

import {
  usePostSchedule,
  type SchedulePostPayload,
} from "../../../Redux/Schedule/usePostSchedule";

import { useUpdateReservedBlock } from "../../../Redux/Schedule/ReservedBlocks/useUpdateReservedBlock";

/* ---------------------- date helpers ---------------------- */
function parseDateTime(dateStr: string, timeStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const sep = dateStr.includes("-") ? "-" : "/";
  const parts = dateStr.split(sep).map((x) => Number(x));
  let y = 0, m = 0, d = 0;
  if (parts[0] > 31) [y, m, d] = parts; else [d, m, y] = parts;
  const [hh = 0, mm = 0, ss = 0] = (timeStr || "00:00:00").split(":").map((x) => Number(x || 0));
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, ss);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/* ----------------------------- Types ------------------------------------- */
export type Mode = "create" | "editReserved";

type ScheduleReduxItem = {
  id: string;
  title: string;
  playlistId: string | number | "";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  screens: Array<{ screenId: number }>;
  groups: Array<{ groupId: number }>;
};

export type ScheduleLike = {
  id: string;
  title: string;
  playlistId: string | number | "";
  startDate: string; // DD-MM-YYYY
  startTime: string; // HH:mm:ss
  endDate: string;   // DD-MM-YYYY
  endTime: string;   // HH:mm:ss
  screens: Array<{ screenId: number }>;
  groups: Array<{ groupId: number }>;
  _reservedBlockId: string | number;
};

type Props = {
  open: boolean;
  itemId?: string | null;
  mode?: Mode;
  overrideItem?: ScheduleLike | null;
  onClose: () => void;
  onSubmit?: (payload: {
    itemId: string;
    screens: Array<{ screenId: number }>;
    groups: Array<{ groupId: number }>;
  }) => void;
  onOpenScheduledScreens?: () => void;
  onCreated?: (args: { serverId: number }) => void; // <-- added
};

/* ---------------------- normalization helpers ---------------------- */
const ddmmyyyyToYmd = (d: string) => {
  const sep = d.includes("-") ? "-" : "/";
  const [a, b, c] = d.split(sep);
  if (Number(a) > 31) return d; // already YYYY-MM-DD
  return `${c}-${b}-${a}`;
};

const toReservedBlockShape = (id: string | number, src: any) => ({
  id: Number(id),
  title: String(src.title ?? ""),
  playlistId: Number(src.playlistId),
  startDate: ddmmyyyyToYmd(String(src.startDate)),
  startTime: String(src.startTime ?? "00:00:00"),
  endDate: ddmmyyyyToYmd(String(src.endDate)),
  endTime: String(src.endTime ?? "00:00:00"),
  screens: (src.screens ?? []).map((s: any) => ({ screenId: Number(s.screenId) })),
  groups: (src.groups ?? []).map((g: any) => ({ groupId: Number(g.groupId) })),
});

const toReservedBlockShapeFromCreate = (resp: any, workingItem: any) => {
  const sched = resp?.schedule ?? {};
  const attached = Array.isArray(resp?.attached_screen_ids)
    ? resp.attached_screen_ids
    : [];

  return {
    id: Number(sched.id),
    title: String(workingItem?.title ?? ""),
    playlistId: Number(sched.playlist_id ?? workingItem?.playlistId ?? 0),
    startDate: String(sched.startDate ?? workingItem?.startDate),
    startTime: String(sched.startTime ?? workingItem?.startTime ?? "00:00:00"),
    endDate: String(sched.endDate ?? workingItem?.endDate),
    endTime: String(sched.endTime ?? workingItem?.endTime ?? "00:00:00"),
    screens: attached.length
      ? attached.map((sid: any) => ({ screenId: Number(sid) }))
      : (workingItem?.screens ?? []).map((s: any) => ({
          screenId: Number(s.screenId),
        })),
    groups: (workingItem?.groups ?? []).map((g: any) => ({
      groupId: Number(g.groupId),
    })),
  } as ReservedBlock;
};

const ScheduleAssignSidebar: React.FC<Props> = ({
  open,
  itemId,
  mode = "create",
  overrideItem,
  onClose,
  onSubmit,
  onOpenScheduledScreens,
  onCreated,
}) => {
  const dispatch = useDispatch();

  /* ------------------------ Selectors ------------------------ */
  const reduxItem = useSelector((state: RootState) => {
    if (!itemId) return undefined;
    return selectScheduleItemById(itemId)(state) as unknown as
      | ScheduleReduxItem
      | undefined;
  });

  const selectedDeviceIds = useSelector(selectSelectedDevices) as Array<
    string | number
  >;
  const selectedGroupIds = useSelector(selectSelectedGroups) as Array<
    string | number
  >;

  const storeScreens =
    useSelector((s: RootState) => s.screens.items as any[] | undefined) ?? [];
  const storeGroups =
    useSelector((s: RootState) => s.groups.items as any[] | undefined) ?? [];

  const reservedBlocks = useSelector(selectAllReservedBlocks);

  /* ----------------------- Local draft for edit mode ---------------------- */
  const [draft, setDraft] = useState<ScheduleLike | null>(null);

  useEffect(() => {
    if (mode === "editReserved" && overrideItem) {
      setDraft(JSON.parse(JSON.stringify(overrideItem)));
    } else {
      setDraft(null);
    }
  }, [mode, overrideItem]);

  const workingItem: ScheduleReduxItem | ScheduleLike | undefined =
    mode === "editReserved" ? draft ?? undefined : reduxItem;

  const selfReservedId =
    mode === "editReserved" ? draft?._reservedBlockId : undefined;

  /* -------------------- Build assignable lists -------------------- */
  const availableScreens = useMemo(() => {
    const set = new Set(selectedDeviceIds.map((v) => Number(v)));
    return storeScreens
      .map((s) => {
        const id = Number(
          (s as any).screenId ?? (s as any).id ?? (s as any)._id
        );
        if (!Number.isFinite(id) || !set.has(id)) return null;
        return {
          id,
          name: s?.name ?? `Screen #${id}`,
          branch: (s as any)?.branch,
          active: !!(s as any)?.active,
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      name: string;
      branch?: string;
      active?: boolean;
    }>;
  }, [storeScreens, selectedDeviceIds]);

  const availableGroups = useMemo(() => {
    const set = new Set(selectedGroupIds.map((v) => Number(v)));
    return storeGroups
      .map((g) => {
        const id = Number(
          (g as any).id ?? (g as any)._id ?? (g as any).groupId
        );
        if (!Number.isFinite(id) || !set.has(id)) return null;
        return {
          id,
          name: g?.name ?? `Group #${id}`,
          branchName: (g as any)?.branchName,
          screenNumber: (g as any)?.screenNumber,
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      name: string;
      branchName?: string;
      screenNumber?: number;
    }>;
  }, [storeGroups, selectedGroupIds]);

  /* ------------------------ Conflicts (by screen) ------------------------- */
  const conflictsByScreen = useMemo(() => {
    const map = new Map<number, ReservedBlock[]>();
    if (!workingItem) return map;

    const itemStart = parseDateTime(
      workingItem.startDate,
      workingItem.startTime
    );
    const itemEnd = parseDateTime(workingItem.endDate, workingItem.endTime);

    for (const b of reservedBlocks) {
      if (selfReservedId != null && b.id === selfReservedId) continue;

      const bStart = parseDateTime(b.startDate, b.startTime);
      const bEnd = parseDateTime(b.endDate, b.endTime);
      if (!overlaps(itemStart, itemEnd, bStart, bEnd)) continue;

      for (const s of b.screens) {
        const sid = Number(s.screenId);
        if (!Number.isFinite(sid)) continue;
        if (!map.has(sid)) map.set(sid, []);
        map.get(sid)!.push(b);
      }
    }
    return map;
  }, [workingItem, reservedBlocks, selfReservedId]);

  const { mutateAsync, isPending } = usePostSchedule({
    onSuccess: (resp) => {
      const serverBlock = toReservedBlockShapeFromCreate(resp, workingItem);

      dispatch(upsertMany([serverBlock]));

      // Let Calendar know to force-show this id
      if (Number.isFinite(serverBlock.id)) {
        onCreated?.({ serverId: Number(serverBlock.id) });
      }

      if (mode !== "editReserved" && workingItem) {
        dispatch(removeItem({ id: (workingItem as ScheduleReduxItem).id }));
      }
      onClose();
    },

    onError: (err) => console.error("❌ postscheduleApi error:", err),
  });

  const { mutateAsync: updateReservedAsync, isPending: isUpdating } =
    useUpdateReservedBlock({
      onSuccess: (resp, vars) => {
        const serverBlock =
          (resp as any)?.id != null
            ? toReservedBlockShape((resp as any).id, resp)
            : null;
        const block = serverBlock ?? toReservedBlockShape(vars.id, vars);

        dispatch(upsertMany([block]));
        onClose();
      },
      onError: (err) => console.error("❌ update reserved block error:", err),
    });

  const busy = isPending || isUpdating;

  /* ---------------------------- Guards / helpers -------------------------- */
  if (!open || !workingItem) return null;

  const isScreenChecked = (screenId: number) =>
    workingItem.screens.some((s) => s.screenId === screenId);

  const isGroupChecked = (groupId: number) =>
    workingItem.groups.some((g) => g.groupId === groupId);

  /* ------------------- playlist assign/clear handlers --------------------- */
  const handlePickPlaylist = ({
    playlistId,
    title,
  }: {
    playlistId: string;
    title?: string;
  }) => {
    if (mode === "editReserved") {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              playlistId,
              title:
                title && title.trim().length > 0
                  ? title
                  : `Playlist #${playlistId}`,
            }
          : prev
      );
      return;
    }
    dispatch(
      setItemPlaylist({ id: (workingItem as ScheduleReduxItem).id, playlistId })
    );
    dispatch(
      setItemTitle({
        id: (workingItem as ScheduleReduxItem).id,
        title:
          title && title.trim().length > 0 ? title : `Playlist #${playlistId}`,
      })
    );
  };

  const handleClearPlaylist = () => {
    if (mode === "editReserved") {
      setDraft((prev) =>
        prev ? { ...prev, playlistId: "", title: "" } : prev
      );
      return;
    }
    dispatch(
      setItemPlaylist({
        id: (workingItem as ScheduleReduxItem).id,
        playlistId: "",
      })
    );
    dispatch(
      setItemTitle({ id: (workingItem as ScheduleReduxItem).id, title: "" })
    );
  };

  /* ------------------------------- submit --------------------------------- */
  const handleSubmit = async () => {
    const src = workingItem;
    if (!src) return;

    const hasTargets = src.screens.length > 0 || src.groups.length > 0;
    if (!hasTargets) {
      console.warn("No screens or groups selected for this block.");
      return;
    }
    if (!src.playlistId || String(src.playlistId).trim() === "") {
      console.warn("No playlist assigned for this block.");
      return;
    }

    const payload: SchedulePostPayload = {
      title: src.title,
      playlistId: String(src.playlistId),
      startDate: src.startDate,
      startTime: src.startTime,
      endDate: src.endDate,
      endTime: src.endTime,
      screens: src.screens.map((s) => ({ screenId: s.screenId })),
      groups: src.groups.map((g) => ({ groupId: g.groupId })),
    };

    onSubmit?.({
      itemId: src.id,
      screens: payload.screens,
      groups: payload.groups,
    });

    if (mode === "editReserved") {
      if (selfReservedId == null) {
        console.warn("Missing reserved block id for update.");
        return;
      }
      await updateReservedAsync({ id: selfReservedId, ...payload } as any);
      return;
    }

    await mutateAsync(payload);
  };

  /* --------------------------------- UI ----------------------------------- */
  return (
    <aside className="fixed right-0 top-0 z-40 h-full w-[360px] border-l border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {mode === "editReserved" ? "Edit reserved block" : "Assign to devices"}
          </div>
          <div className="text-[12px] text-gray-600">
            Block:{" "}
            <span className="font-medium">
              {workingItem.title || "(untitled)"}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          aria-label="Close"
          disabled={busy}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100%-56px)] flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* Playlist */}
          <PlaylistPicker
            currentPlaylistId={
              String(workingItem.playlistId || "") || undefined
            }
            onPick={handlePickPlaylist}
            onClear={handleClearPlaylist}
            disabled={busy}
          />

          {/* Screens */}
          <section>
            <div className="mb-2 flex items中心 gap-2">
              <Monitor className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Screens</h3>
              <span className="text-[11px] text-gray-500">
                {availableScreens.length}
              </span>

              {onOpenScheduledScreens && (
                <button
                  type="button"
                  onClick={onOpenScheduledScreens}
                  className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 px-1.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                  title="Open reserved targets panel"
                  disabled={busy}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add / View
                </button>
              )}
            </div>
            {availableScreens.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-[12px] text-gray-600">
                No selected screens.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {availableScreens.map((s) => {
                  const conflicts = conflictsByScreen.get(s.id) || [];
                  const hasConflict = conflicts.length > 0;
                  const tip =
                    hasConflict && conflicts[0]
                      ? `Conflicts with "${conflicts[0].title}" ${conflicts[0].startDate} ${conflicts[0].startTime} → ${conflicts[0].endDate} ${conflicts[0].endTime}`
                      : "";

                  return (
                    <li key={s.id}>
                      <label
                        className={[
                          "flex cursor-pointer items-center gap-2 rounded-md border bg白 px-2.5 py-2 text-sm transition",
                          hasConflict
                            ? "border-red-200 bg-red-50/60"
                            : "border-gray-200 hover:bg-gray-50",
                        ].join(" ")}
                        title={tip}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-red-500"
                          checked={isScreenChecked(s.id)}
                          disabled={busy || hasConflict}
                          onChange={(e) => {
                            if (mode === "editReserved") {
                              setDraft((prev) => {
                                if (!prev) return prev;
                                if (e.target.checked) {
                                  const nextIds = new Set(
                                    prev.screens.map((x) => x.screenId)
                                  );
                                  nextIds.add(s.id);
                                  return {
                                    ...prev,
                                    screens: Array.from(nextIds).map((id) => ({
                                      screenId: id,
                                    })),
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    screens: prev.screens.filter(
                                      (x) => x.screenId !== s.id
                                    ),
                                  };
                                }
                              });
                            } else {
                              if (e.target.checked) {
                                dispatch(
                                  addScreenToItem({
                                    id: (workingItem as ScheduleReduxItem).id,
                                    screen: { screenId: s.id },
                                  })
                                );
                              } else {
                                dispatch(
                                  removeScreenFromItem({
                                    id: (workingItem as ScheduleReduxItem).id,
                                    screenId: s.id,
                                  })
                                );
                              }
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <div className="truncate font-medium text-gray-900">
                              {s.name}
                            </div>
                            {hasConflict && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-[2px] text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Conflicts
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-gray-600">
                            ID: {s.id}
                            {s.branch ? ` · ${s.branch}` : ""}
                            {s.active ? ` · Active` : ` · Inactive`}
                          </div>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Groups */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Groups</h3>
              <span className="text-[11px] text-gray-500">
                {availableGroups.length}
              </span>
            </div>
            {availableGroups.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-[12px] text-gray-600">
                No selected groups.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {availableGroups.map((g) => (
                  <li key={g.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-red-500"
                        checked={isGroupChecked(g.id)}
                        disabled={busy}
                        onChange={(e) => {
                          if (mode === "editReserved") {
                            setDraft((prev) => {
                              if (!prev) return prev;
                              if (e.target.checked) {
                                const nextIds = new Set(
                                  prev.groups.map((x) => x.groupId)
                                );
                                nextIds.add(g.id);
                                return {
                                  ...prev,
                                  groups: Array.from(nextIds).map((id) => ({
                                    groupId: id,
                                  })),
                                };
                              } else {
                                return {
                                  ...prev,
                                  groups: prev.groups.filter(
                                    (x) => x.groupId !== g.id
                                  ),
                                };
                              }
                            });
                          } else {
                            if (e.target.checked) {
                              dispatch(
                                addGroupToItem({
                                  id: (workingItem as ScheduleReduxItem).id,
                                  group: { groupId: g.id },
                                })
                              );
                            } else {
                              dispatch(
                                removeGroupFromItem({
                                  id: (workingItem as ScheduleReduxItem).id,
                                  groupId: g.id,
                                })
                              );
                            }
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {g.name}
                        </div>
                        <div className="truncate text-[11px] text-gray-600">
                          ID: {g.id}
                          {typeof g.screenNumber === "number"
                            ? ` · Screens: ${g.screenNumber}`
                            : ""}
                          {g.branchName ? ` · ${g.branchName}` : ""}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={
                "rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white " +
                (busy ? "opacity-75 cursor-not-allowed" : "hover:bg-red-600")
              }
              disabled={busy}
            >
              {busy
                ? mode === "editReserved"
                  ? "Saving…"
                  : "Submitting…"
                : mode === "editReserved"
                ? "Save changes"
                : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ScheduleAssignSidebar;
