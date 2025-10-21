// src/Screens/Schedule/ScreenSchedule.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Layers,
  Monitor,
  RefreshCw,
  Search,
  UsersRound,
  BadgeCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Redux slices
import {
  setGroups,
  selectGroups,
  type Group,
} from "../../Redux/ScreenManagement/GroupSlice";
import {
  setScreens,
  type Screen as SliceScreen,
} from "../../Redux/ScreenManagement/ScreenSlice";

// Selected block id + updater
import {
  selectSelectedBlockId,
  updateBlockParts,
} from "../../Redux/Schedule/SheduleSlice";

// React Query hooks
import { useGetGroups } from "../../ReactQuery/Group/GetGroup";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";

/** ===== Types ===== */
type FilterMode = "all" | "groups" | "screens";

type Props = {
  blockId?: string; // optional; falls back to selected block in Redux
  defaultFilter?: FilterMode;
  /** Set of screenIds that are in conflict for the current block */
  conflictedScreenIds?: Set<number | string>;
};

const ScreenSchedule: React.FC<Props> = ({
  blockId: blockIdProp,
  defaultFilter = "all",
  conflictedScreenIds = new Set(),
}) => {
  const dispatch = useDispatch();

  /** Fetch & hydrate Redux (once) */
  const { data: apiGroups, refetch: refetchGroups } = useGetGroups();
  const { data: apiScreens, refetch: refetchScreens } = useGetScreen();

  const groups = useSelector(selectGroups) as Group[];
  const screens = useSelector(
    (s: RootState) => s.screens.items
  ) as SliceScreen[];

  useEffect(() => {
    if (!groups.length && Array.isArray(apiGroups) && apiGroups.length) {
      dispatch(setGroups(apiGroups as Group[]));
    }
  }, [groups.length, apiGroups, dispatch]);

  useEffect(() => {
    if (!screens.length && Array.isArray(apiScreens) && apiScreens.length) {
      dispatch(setScreens(apiScreens as unknown as SliceScreen[]));
    }
  }, [screens.length, apiScreens, dispatch]);

  /** Effective block id: prop or selected */
  const selectedBlockId = useSelector(selectSelectedBlockId);
  const effectiveBlockId = blockIdProp ?? selectedBlockId ?? undefined;

  /** Read current block selection FROM REDUX (single source of truth) */
  const block = useSelector((s: RootState) =>
    s.schedule.blocks.find((b) => b.id === effectiveBlockId)
  );

  // Current selection mirrored from the block in Redux
  const selection = useMemo(() => {
    const gRaw = (block as any)?.groupId;
    const groupIds = Array.isArray(gRaw) ? gRaw : gRaw != null ? [gRaw] : [];
    const scr = (block as any)?.screens;
    const screenIds = Array.isArray(scr)
      ? scr.map((x: any) => x.screenId ?? x.id)
      : [];
    return { groupIds, screenIds };
  }, [block?.id, (block as any)?.groupId, (block as any)?.screens]);

  /** UI state */
  const [mode, setMode] = useState<FilterMode>(defaultFilter);
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /** Union list for rendering */
  type Row =
    | {
        kind: "group";
        id: number | string;
        name: string;
        branchName?: string;
        screenNumber?: number;
      }
    | {
        kind: "screen";
        id: number | string; // use screenId here
        name: string;
        branch?: string;
        screenId?: string | number;
        active?: boolean;
      };

  const unionAll: Row[] = useMemo(() => {
    const gRows: Row[] = groups.map((g) => ({
      kind: "group",
      id: g.id,
      name: g.name,
      branchName: (g as any)?.branchName,
      screenNumber: (g as any)?.screenNumber,
    }));

    const sRows: Row[] = screens.map((s) => {
      const sid = (s as any).screenId ?? (s as any).id ?? (s as any)._id;
      return {
        kind: "screen",
        id: sid, // ← screenId as identity
        name: s.name || `Screen #${sid ?? "?"}`,
        branch: (s as any).branch,
        screenId: (s as any).screenId,
        active: (s as any).active ?? false,
      };
    });

    return [...gRows, ...sRows];
  }, [groups, screens]);

  /** Filtered list */
  const filtered: Row[] = useMemo(() => {
    let base = unionAll;
    if (mode === "groups") base = base.filter((r) => r.kind === "group");
    if (mode === "screens") base = base.filter((r) => r.kind === "screen");
    if ((mode === "screens" || mode === "all") && onlyActive) {
      base = base.filter((r) => (r.kind === "screen" ? !!r.active : true));
    }
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((r) => {
      const parts =
        r.kind === "group"
          ? [r.name, r.branchName, r.id, r.screenNumber]
          : [
              r.name,
              r.branch,
              r.id,
              r.screenId,
              (r as any).active ? "active" : "inactive",
            ];
      return parts
        .filter(Boolean)
        .map(String)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [unionAll, mode, query, onlyActive]);

  /** WRITE-THROUGH to Redux on every click */
  const writeSelection = (next: {
    groupIds?: Array<number | string>;
    screenIds?: Array<number | string>;
  }) => {
    if (!effectiveBlockId) return;

    const nextGroupIds = next.groupIds ?? selection.groupIds;
    const nextScreenIds = next.screenIds ?? selection.screenIds;

    const firstGroupId = nextGroupIds[0];
    dispatch(
      updateBlockParts({
        id: effectiveBlockId,
        groupId:
          typeof firstGroupId !== "undefined" ? firstGroupId : undefined,
        screens: nextScreenIds.map((id) => ({ screenId: id })),
      })
    );
  };

  const toggleRow = (row: Row) => {
    if (!effectiveBlockId) return;

    if (row.kind === "group") {
      const exists = selection.groupIds.some(
        (x) => String(x) === String(row.id)
      );
      const next = exists
        ? selection.groupIds.filter((x) => String(x) !== String(row.id))
        : [...selection.groupIds, row.id];
      writeSelection({ groupIds: next });
    } else {
      // block conflicting screens from being toggled ON
      const isConflict = conflictedScreenIds.has(row.id as any);
      if (isConflict) return;

      const exists = selection.screenIds.some(
        (x) => String(x) === String(row.id)
      );
      const next = exists
        ? selection.screenIds.filter((x) => String(x) !== String(row.id))
        : [...selection.screenIds, row.id];
      writeSelection({ screenIds: next });
    }
  };

  const clearSelection = () =>
    writeSelection({ groupIds: [], screenIds: [] });

  const selectAllInView = () => {
    const gIds = filtered
      .filter((r) => r.kind === "group")
      .map((r) => r.id);
    const sIds = filtered
      .filter(
        (r) => r.kind === "screen" && !conflictedScreenIds.has(r.id as any)
      )
      .map((r) => r.id);

    const uniq = (arr: Array<number | string>) =>
      Array.from(new Set(arr.map(String))).map((s) =>
        Number.isNaN(Number(s)) ? s : (Number(s) as any)
      );

    writeSelection({
      groupIds: uniq([...selection.groupIds, ...gIds]),
      screenIds: uniq([...selection.screenIds, ...sIds]),
    });
  };

  const selectedCount =
    selection.groupIds.length + selection.screenIds.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [gRes, sRes] = await Promise.all([
        refetchGroups(),
        refetchScreens(),
      ]);
      const freshG = (gRes as any)?.data;
      const freshS = (sRes as any)?.data;
      if (Array.isArray(freshG)) dispatch(setGroups(freshG as Group[]));
      if (Array.isArray(freshS))
        dispatch(setScreens(freshS as unknown as SliceScreen[]));
    } finally {
      setIsRefreshing(false);
    }
  };

  /** ===== UI ===== */
  return (
    <section className="w-full">
      {/* Top bar */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {(["all", "groups", "screens"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={[
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition",
                  mode === m
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
                aria-pressed={mode === m}
              >
                {m === "all" && <Layers className="h-4 w-4" />}
                {m === "groups" && <UsersRound className="h-4 w-4" />}
                {m === "screens" && <Monitor className="h-4 w-4" />}
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>

          {(mode === "screens" || mode === "all") ? (
            <button
              type="button"
              onClick={() => setOnlyActive((v) => !v)}
              className={[
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
                onlyActive
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white hover:bg-gray-50",
              ].join(" ")}
              title="Only active screens"
            >
              <BadgeCheck className="h-4 w-4" />
              Active
            </button>
          ) : null}
        </div>

        {/* Search + Actions */}
        <div className="flex items-center gap-2 md:max-w-xl w-full">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, branch, ID…"
              className="w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
          </div>

          <button
            type="button"
            onClick={selectAllInView}
            disabled={!filtered.length || !effectiveBlockId}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Select all (view)
          </button>

          <button
            type="button"
            onClick={clearSelection}
            disabled={!selectedCount || !effectiveBlockId}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Selection summary */}
      <div className="mb-2 text-xs text-red-700">
        <span className="rounded-full bg-red-50 ring-1 ring-red-100 px-2 py-0.5">
          {selectedCount} selected — {selection.groupIds.length} groups,{" "}
          {selection.screenIds.length} screens
        </span>
      </div>

      {/* Grid */}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const selected =
            r.kind === "group"
              ? selection.groupIds.some(
                  (x) => String(x) === String(r.id)
                )
              : selection.screenIds.some(
                  (x) => String(x) === String(r.id)
                );

          const isConflict =
            r.kind === "screen" && conflictedScreenIds.has(r.id as any);

          return (
            <li key={`${r.kind}-${r.id}`}>
              <button
                type="button"
                onClick={() => toggleRow(r)}
                disabled={!effectiveBlockId || isConflict}
                title={
                  isConflict
                    ? "This screen is already scheduled in a conflicting time window"
                    : undefined
                }
                className={[
                  "group relative w-full overflow-hidden rounded-xl border bg-white p-3 text-left transition disabled:opacity-60",
                  selected
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
                  isConflict ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                {/* Check bubble */}
                <span
                  className={[
                    "absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs transition",
                    selected
                      ? "bg-red-500 border-red-600 text-white"
                      : "bg-white border-gray-200 text-gray-400 group-hover:text-gray-600",
                  ].join(" ")}
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" />
                </span>

                <div className="flex items-center gap-2">
                  <div
                    className={[
                      "grid h-10 w-10 place-items-center rounded-lg",
                      r.kind === "group"
                        ? "bg-red-50 text-red-600"
                        : (r as any).active
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {r.kind === "group" ? (
                      <UsersRound className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {r.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {r.kind === "group" ? (
                        <>
                          ID: {r.id}
                          {typeof (r as any).screenNumber !== "undefined"
                            ? ` · Screens: ${(r as any).screenNumber}`
                            : ""}
                          {typeof (r as any).branchName !== "undefined"
                            ? ` · Branch: ${(r as any).branchName}`
                            : ""}
                        </>
                      ) : (
                        <>
                          ID: {r.id}
                          {typeof (r as any).screenId !== "undefined"
                            ? ` · HW: ${(r as any).screenId}`
                            : ""}
                          {typeof (r as any).branch !== "undefined"
                            ? ` · Branch: ${(r as any).branch}`
                            : ""}
                          {(r as any).active ? ` · Active` : ` · Inactive`}
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={[
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                      r.kind === "group"
                        ? "bg-red-50 text-red-700 ring-red-200"
                        : isConflict
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-gray-50 text-gray-700 ring-gray-200",
                    ].join(" ")}
                  >
                    {r.kind === "group"
                      ? "Group"
                      : isConflict
                      ? "Conflict"
                      : "Screen"}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ScreenSchedule;
