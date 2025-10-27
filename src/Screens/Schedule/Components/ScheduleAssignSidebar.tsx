import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Monitor, UsersRound, AlertTriangle } from "lucide-react";

import {
  addGroupToItem,
  addScreenToItem,
  removeGroupFromItem,
  removeScreenFromItem,
  setItemPlaylist,
  setItemTitle,
} from "../../../Redux/Schedule/SheduleSlice";

import { selectSelectedDevices } from "../../../Redux/ScreenManagement/ScreenSlice";
import { selectSelectedGroups } from "../../../Redux/ScreenManagement/GroupSlice";
import type { RootState } from "../../../../store";

import {
  usePostSchedule,
  type SchedulePostPayload,
} from "../../../Redux/Schedule/usePostSchedule";

import { selectAllReservedBlocks } from "../../../Redux/Schedule/ReservedBlocks/ReservedBlockSlice";
import type { ReservedBlock } from "../../../Redux/Schedule/ReservedBlocks/ReservedBlockSlice";

import PlaylistPicker from "./PlaylistPicker";
import { selectScheduleItemById } from "../../../Redux/Schedule/ScheduleSelectors";

/* ---------------------- date helpers: robust parsing ---------------------- */
function parseDateTime(dateStr: string, timeStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const sep = dateStr.includes("-") ? "-" : "/";
  const parts = dateStr.split(sep).map((x) => Number(x));
  let y = 0, m = 0, d = 0;
  if (parts[0] > 31) [y, m, d] = parts; else [d, m, y] = parts;
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((x) => Number(x || 0));
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/* ----------------------------- Types ------------------------------------- */
type Mode = "create" | "editReserved";

/** Minimal shape of the Redux schedule item we read from the store */
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

type ScheduleLike = ScheduleReduxItem & {
  /** only present in editReserved mode */
  _reservedBlockId?: string | number;
};

type Props = {
  open: boolean;
  itemId: string | null;      // used in "create" mode
  mode?: Mode;                // "create" | "editReserved"
  overrideItem?: ScheduleLike; // used in "editReserved" mode
  onClose: () => void;
  onSubmit?: (payload: {
    itemId: string;
    screens: Array<{ screenId: number }>;
    groups: Array<{ groupId: number }>;
  }) => void;
};

const ScheduleAssignSidebar: React.FC<Props> = ({
  open,
  itemId,
  mode = "create",
  overrideItem,
  onClose,
  onSubmit,
}) => {
  const dispatch = useDispatch();

  /* ------------------------ Selectors (ALWAYS call) ----------------------- */
  const reduxItem = useSelector((state: RootState) => {
    if (!itemId) return undefined;
    // selector returns a ScheduleItem from your store; we cast to our minimal shape
    return selectScheduleItemById(itemId)(state) as unknown as ScheduleReduxItem | undefined;
  });

  const selectedDeviceIds = useSelector(selectSelectedDevices) as Array<string | number>;
  const selectedGroupIds = useSelector(selectSelectedGroups) as Array<string | number>;

  const storeScreens =
    useSelector((s: RootState) => s.screens.items as any[] | undefined) ?? [];
  const storeGroups =
    useSelector((s: RootState) => s.groups.items as any[] | undefined) ?? [];

  const reservedBlocks = useSelector(selectAllReservedBlocks);

  /* ----------------------- Effective item & self id ----------------------- */
  const item: ScheduleReduxItem | ScheduleLike | undefined =
    mode === "editReserved" && overrideItem ? overrideItem : reduxItem;

  // ✅ Only defined in edit mode; never read from `item._reservedBlockId` directly
  const selfReservedId = mode === "editReserved" ? overrideItem?._reservedBlockId : undefined;

  /* -------------------- Build assignable lists from store ------------------ */
  const availableScreens = useMemo(() => {
    const set = new Set(selectedDeviceIds.map((v) => Number(v)));
    return storeScreens
      .map((s) => {
        const id = Number((s as any).screenId ?? (s as any).id ?? (s as any)._id);
        if (!Number.isFinite(id) || !set.has(id)) return null;
        return {
          id,
          name: s?.name ?? `Screen #${id}`,
          branch: (s as any)?.branch,
          active: !!(s as any)?.active,
        };
      })
      .filter(Boolean) as Array<{ id: number; name: string; branch?: string; active?: boolean }>;
  }, [storeScreens, selectedDeviceIds]);

  const availableGroups = useMemo(() => {
    const set = new Set(selectedGroupIds.map((v) => Number(v)));
    return storeGroups
      .map((g) => {
        const id = Number((g as any).id ?? (g as any)._id ?? (g as any).groupId);
        if (!Number.isFinite(id) || !set.has(id)) return null;
        return {
          id,
          name: g?.name ?? `Group #${id}`,
          branchName: (g as any)?.branchName,
          screenNumber: (g as any)?.screenNumber,
        };
      })
      .filter(Boolean) as Array<{ id: number; name: string; branchName?: string; screenNumber?: number }>;
  }, [storeGroups, selectedGroupIds]);

  /* ------------------------ compute screen conflicts ----------------------- */
  const conflictsByScreen = useMemo(() => {
    const map = new Map<number, ReservedBlock[]>();
    if (!item) return map;

    const itemStart = parseDateTime(item.startDate, item.startTime);
    const itemEnd = parseDateTime(item.endDate, item.endTime);

    for (const b of reservedBlocks) {
      // ✅ skip the same reserved block when editing
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
  }, [item, reservedBlocks, selfReservedId]);

  /* -------------------------- Create flow mutation ------------------------ */
  const { mutateAsync, isPending } = usePostSchedule({
    onSuccess: (resp) => {
      console.log("✅ postscheduleApi response:", resp);
      onClose();
    },
    onError: (err) => {
      console.error("❌ postscheduleApi error:", err);
    },
  });

  /* ---------------------------- Guards / helpers -------------------------- */
  if (!open || !item) return null;

  const isScreenChecked = (screenId: number) =>
    item.screens.some((s) => s.screenId === screenId);

  const isGroupChecked = (groupId: number) =>
    item.groups.some((g) => g.groupId === groupId);

  /* ------------------- playlist assign/clear handlers --------------------- */
  const handlePickPlaylist = ({ playlistId, title }: { playlistId: string; title?: string }) => {
    if (mode === "editReserved") {
      (item as ScheduleLike).playlistId = playlistId;
      (item as ScheduleLike).title =
        title && title.trim().length > 0 ? title : `Playlist #${playlistId}`;
      return;
    }
    dispatch(setItemPlaylist({ id: (item as ScheduleReduxItem).id, playlistId }));
    dispatch(
      setItemTitle({
        id: (item as ScheduleReduxItem).id,
        title: title && title.trim().length > 0 ? title : `Playlist #${playlistId}`,
      })
    );
  };

  const handleClearPlaylist = () => {
    if (mode === "editReserved") {
      (item as ScheduleLike).playlistId = "";
      (item as ScheduleLike).title = "";
      return;
    }
    dispatch(setItemPlaylist({ id: (item as ScheduleReduxItem).id, playlistId: "" }));
    dispatch(setItemTitle({ id: (item as ScheduleReduxItem).id, title: "" }));
  };

  /* -------------------------------- submit -------------------------------- */
  const handleSubmit = async () => {
    if (!item) return;

    const hasTargets = item.screens.length > 0 || item.groups.length > 0;
    if (!hasTargets) {
      console.warn("No screens or groups selected for this block.");
      return;
    }
    if (!item.playlistId || String(item.playlistId).trim() === "") {
      console.warn("No playlist assigned for this block.");
      return;
    }

    const payload: SchedulePostPayload = {
      title: item.title,
      playlistId: String(item.playlistId),
      startDate: item.startDate,
      startTime: item.startTime,
      endDate: item.endDate,
      endTime: item.endTime,
      screens: item.screens.map((s) => ({ screenId: s.screenId })),
      groups: item.groups.map((g) => ({ groupId: g.groupId })),
    };

    if (onSubmit) {
      onSubmit({
        itemId: item.id,
        screens: payload.screens,
        groups: payload.groups,
      });
    }

    if (mode === "editReserved") {
      // TODO: call your UPDATE reserved-block API with selfReservedId
      console.log("📝 Would update reserved block:", selfReservedId, payload);
      onClose();
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
            Block: <span className="font-medium">{item.title || "(untitled)"}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          aria-label="Close"
          disabled={isPending}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100%-56px)] flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* Playlist */}
          <PlaylistPicker
            currentPlaylistId={String(item.playlistId || "") || undefined}
            onPick={handlePickPlaylist}
            onClear={handleClearPlaylist}
            disabled={isPending}
          />

          {/* Screens */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Screens</h3>
              <span className="text-[11px] text-gray-500">{availableScreens.length}</span>
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
                          "flex cursor-pointer items-center gap-2 rounded-md border bg-white px-2.5 py-2 text-sm transition",
                          hasConflict ? "border-red-200 bg-red-50/60" : "border-gray-200 hover:bg-gray-50",
                        ].join(" ")}
                        title={tip}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-red-500"
                          checked={isScreenChecked(s.id)}
                          disabled={isPending || hasConflict}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (mode === "editReserved") {
                                (item as ScheduleLike).screens = Array.from(
                                  new Set([...(item as ScheduleLike).screens.map((x) => x.screenId), s.id])
                                ).map((id) => ({ screenId: id }));
                              } else {
                                dispatch(
                                  addScreenToItem({
                                    id: (item as ScheduleReduxItem).id,
                                    screen: { screenId: s.id },
                                  })
                                );
                              }
                            } else {
                              if (mode === "editReserved") {
                                (item as ScheduleLike).screens = (item as ScheduleLike).screens.filter(
                                  (x) => x.screenId !== s.id
                                );
                              } else {
                                dispatch(
                                  removeScreenFromItem({
                                    id: (item as ScheduleReduxItem).id,
                                    screenId: s.id,
                                  })
                                );
                              }
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <div className="truncate font-medium text-gray-900">{s.name}</div>
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
              <span className="text-[11px] text-gray-500">{availableGroups.length}</span>
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
                        disabled={isPending}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (mode === "editReserved") {
                              (item as ScheduleLike).groups = Array.from(
                                new Set([...(item as ScheduleLike).groups.map((x) => x.groupId), g.id])
                              ).map((id) => ({ groupId: id }));
                            } else {
                              dispatch(
                                addGroupToItem({
                                  id: (item as ScheduleReduxItem).id,
                                  group: { groupId: g.id },
                                })
                              );
                            }
                          } else {
                            if (mode === "editReserved") {
                              (item as ScheduleLike).groups = (item as ScheduleLike).groups.filter(
                                (x) => x.groupId !== g.id
                              );
                            } else {
                              dispatch(
                                removeGroupFromItem({
                                  id: (item as ScheduleReduxItem).id,
                                  groupId: g.id,
                                })
                              );
                            }
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">{g.name}</div>
                        <div className="truncate text-[11px] text-gray-600">
                          ID: {g.id}
                          {typeof g.screenNumber === "number" ? ` · Screens: ${g.screenNumber}` : ""}
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
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={
                "rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white " +
                (isPending ? "opacity-75 cursor-not-allowed" : "hover:bg-red-600")
              }
              disabled={isPending}
            >
              {isPending
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
