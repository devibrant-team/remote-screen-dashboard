import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { UsersRound, Monitor, Layers, Check, X, Search } from "lucide-react";

import {
  selectGroups,
  selectSelectedGroups,
  setGroups,
  toggleSelectedGroup,
  type Group,
} from "../../Redux/ScreenManagement/GroupSlice";

import type { RootState } from "../../../store";
import {
  selectSelectedDevices,
  setScreens,
  toggleSelectedDevice,
} from "../../Redux/ScreenManagement/ScreenSlice";

import { useGetGroups } from "../../ReactQuery/Group/GetGroup";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";
import {
  postGetScheduleDetails,
  type ScheduleDetailsResponse,
} from "../../Redux/ReservedBlocks/GetDeviceSchedule";
import {
  setReservedSelection,
  upsertMany,
  type ReservedBlock,
} from "../../Redux/ReservedBlocks/ReservedBlocks";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type FilterMode = "all" | "groups" | "screens";

type SelectDevicesModelProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: (payload: {
    selectedGroups: Array<string | number>;
    selectedDevices: Array<string | number>;
  }) => void;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Return a stable device key as string|number from a device object or primitive */
function getDeviceKey(d: any): string | number | null {
  if (d == null) return null;
  if (typeof d === "string" || typeof d === "number") return d;
  const raw = d.screenId ?? d.id ?? d._id;
  if (raw == null) return null;
  return typeof raw === "number" || typeof raw === "string" ? raw : String(raw);
}

/** Return a stable screen key from a screen entity (for matching) */
function getScreenKey(s: any): string | number | null {
  const raw = s?.screenId ?? s?.id ?? s?._id;
  if (raw == null) return null;
  return typeof raw === "number" || typeof raw === "string" ? raw : String(raw);
}

/** Map API response → ReservedBlock[] (uses the exact response you provided) */
function mapApiToReservedBlocks(api: ScheduleDetailsResponse): ReservedBlock[] {
  const list = api?.data?.schedule ?? [];
  return list.map((r) => ({
    id: r.id,
    title: r.title,
    scheduleItemName: r.scheduleItem,
    playlistId: r.playlistId,
    startDate: r.startDate,
    endDate: r.endDate ?? undefined,
    startTime: r.startTime,
    endTime: r.endTime,
    groups: (r.groups ?? []).map((g) => ({
      id: g.groupId,
      name: g.groupName ?? `Group #${g.groupId}`,
    })),
    screens: (r.screens ?? []).map((s) => ({
      id: s.screenId,
      name: s.screenName ?? `Screen #${s.screenId}`,
    })),
  }));
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const SelectDevicesModel: React.FC<SelectDevicesModelProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const dispatch = useDispatch();

  // Redux state (no SliceScreen typing—keep it flexible)
  const groups = useSelector(selectGroups) as Group[];
  const screens = useSelector(
    (s: RootState) => (s as any).screens.items
  ) as any[];

  // Might be array of IDs OR array of objects → normalize below
  const selectedDevicesRaw = useSelector(selectSelectedDevices) as any[];
  const selectedGroups = useSelector(selectSelectedGroups) as Array<
    string | number
  >;

  // Normalize device IDs safely to (string|number)[]
  const selectedDeviceIds = useMemo(() => {
    const out: Array<string | number> = [];
    for (const d of selectedDevicesRaw ?? []) {
      const k = getDeviceKey(d);
      if (k !== null) out.push(k);
    }
    return out;
  }, [selectedDevicesRaw]);

  // Prefetch/hydrate lists if slice empty
  const { data: apiGroups, isLoading: loadingGroups } = useGetGroups();
  const { data: apiScreens, isLoading: loadingScreens } = useGetScreen();

  useEffect(() => {
    if (!groups.length && Array.isArray(apiGroups) && apiGroups.length) {
      dispatch(setGroups(apiGroups as Group[]));
    }
  }, [groups.length, apiGroups, dispatch]);



  useEffect(() => {
    if (!screens?.length && Array.isArray(apiScreens) && apiScreens.length) {
      dispatch(setScreens(apiScreens as any[]));
    }
  }, [screens?.length, apiScreens, dispatch]);

  // UI state
  const [mode, setMode] = useState<FilterMode>("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------ union view ------------------------------ */
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
        id: number | string;
        name: string;
        branch?: string;
        screenId?: string | number;
        active?: boolean;
      };

  const unionAll: Row[] = useMemo(() => {
    const gRows: Row[] = (groups ?? []).map((g) => ({
      kind: "group",
      id: g.id,
      name: g.name,
      branchName: (g as any)?.branchName,
      screenNumber: (g as any)?.screenNumber,
    }));

    const sRows: Row[] = (screens ?? []).map((s) => {
      const sid = getScreenKey(s);
      return {
        kind: "screen",
        id: sid ?? `unknown-${Math.random()}`,
        name: s?.name || `Screen #${sid ?? "?"}`,
        branch: s?.branch,
        screenId: s?.screenId,
        active: s?.active ?? false,
      };
    });

    return [...gRows, ...sRows];
  }, [groups, screens]);

  const filtered: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = unionAll;
    if (mode === "groups") list = list.filter((r) => r.kind === "group");
    if (mode === "screens") list = list.filter((r) => r.kind === "screen");
    if ((mode === "screens" || mode === "all") && onlyActive) {
      list = list.filter((r) => (r.kind === "screen" ? !!r.active : true));
    }
    if (q) {
      list = list.filter((r) => {
        const bag =
          r.kind === "group"
            ? `${r.name} ${r.branchName ?? ""} ${r.screenNumber ?? ""}`
            : `${r.name} ${r.branch ?? ""} ${r.screenId ?? ""} ${
                r.active ? "active" : "inactive"
              }`;
        return bag.toLowerCase().includes(q);
      });
    }
    return list;
  }, [unionAll, mode, onlyActive, query]);

  /* -------------------------- selection helpers --------------------------- */
  const rowIsSelected = (row: Row) =>
    row.kind === "group"
      ? selectedGroups.some((gid) => String(gid) === String(row.id))
      : selectedDeviceIds.some((sid) => String(sid) === String(row.id));

  const handleToggleRow = (row: Row) => {
    if (row.kind === "group") dispatch(toggleSelectedGroup(row.id));
    else dispatch(toggleSelectedDevice(row.id));
  };

  const selectedChips: Array<{
    label: string;
    kind: Row["kind"];
    id: string | number;
  }> = useMemo(() => {
    const chips: Array<{
      label: string;
      kind: Row["kind"];
      id: string | number;
    }> = [];
    // groups
    for (const gid of selectedGroups ?? []) {
      const g = groups.find((x) => String(x.id) === String(gid));
      if (g) chips.push({ label: g.name, kind: "group", id: gid });
    }
    // screens by ID
    for (const sid of selectedDeviceIds ?? []) {
      const s = (screens ?? []).find(
        (x: any) => String(getScreenKey(x)) === String(sid)
      );
      const label = s?.name || `Screen #${sid}`;
      chips.push({ label, kind: "screen", id: sid });
    }
    return chips;
  }, [selectedGroups, selectedDeviceIds, groups, screens]);

  const handleRemoveChip = (chip: {
    kind: Row["kind"];
    id: string | number;
  }) => {
    if (chip.kind === "group") dispatch(toggleSelectedGroup(chip.id));
    else dispatch(toggleSelectedDevice(chip.id));
  };

  const clearAllSelected = () => {
    (selectedGroups ?? []).forEach((gid) => dispatch(toggleSelectedGroup(gid)));
    (selectedDeviceIds ?? []).forEach((sid) =>
      dispatch(toggleSelectedDevice(sid))
    );
  };

  const isLoading = loadingGroups || loadingScreens;

  /* --------------------------- modal wiring ------------------------------- */
  const panelRef = useRef<HTMLDivElement | null>(null);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node))
      onClose();
  };

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  /* ------------------------------ render ---------------------------------- */
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        className="relative w-[min(1100px,95vw)] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/90 px-6 py-4 backdrop-blur">
          <h2 className="text-base font-semibold text-gray-900">
            Select Targets
          </h2>
        </div>

        {/* Controls */}
        <div className="sticky top-0 z-10 -mx-6 mb-3 border-b border-gray-200 bg-white/90 px-6 py-3 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-3 md:items-center">
            {/* Mode buttons */}
            <div className="flex flex-wrap items-center gap-2">
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

              {/* Only active (screens) */}
              <label className="ml-2 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                />
                Only active screens
              </label>
            </div>

            {/* Search */}
            <div className="md:col-span-2 md:justify-self-end">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full md:w-[360px] rounded-md border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Search by name, branch, ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="max-h-[calc(90vh-56px-64px)] overflow-y-auto px-6 pb-6 pt-2">
          {/* Selected chips */}
          {selectedChips.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedChips.map((chip) => (
                <span
                  key={`${chip.kind}-${chip.id}`}
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ring-1",
                    chip.kind === "group"
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : "bg-gray-50 text-gray-700 ring-gray-200",
                  ].join(" ")}
                >
                  {chip.kind === "group" ? (
                    <UsersRound className="h-3.5 w-3.5" />
                  ) : (
                    <Monitor className="h-3.5 w-3.5" />
                  )}
                  <span className="max-w-[160px] truncate">{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(chip)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg.black/5"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllSelected}
                className="text-[11px] text-gray-600 underline decoration-dotted underline-offset-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
              <p className="text-sm text-gray-600">
                Nothing here. Try filters or search.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const isSelected = rowIsSelected(r);
                const statusDot =
                  r.kind === "screen" ? (
                    <span
                      className={[
                        "inline-block h-2 w-2 rounded-full",
                        (r as any).active ? "bg-green-500" : "bg-gray-300",
                      ].join(" ")}
                      aria-hidden
                    />
                  ) : null;

                return (
                  <li key={`${r.kind}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => handleToggleRow(r)}
                      className={[
                        "group relative w-full overflow-hidden rounded-xl border bg-white p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                        isSelected
                          ? "border-red-500 ring-1 ring-red-200"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs transition",
                          isSelected
                            ? "bg-red-500 border-red-600 text-white"
                            : "bg-white border-gray-200 text-gray-400 group-hover:text-gray-600",
                        ].join(" ")}
                        aria-hidden
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>

                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "grid h-10 w-10 place-items-center rounded-lg",
                            r.kind === "group"
                              ? "bg-red-50 text-red-600"
                              : (r as any).active
                              ? "bg-green-50 text-green-700"
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
                          <div className="flex items-center gap-2">
                            {statusDot}
                            <div className="truncate text-sm font-medium text-gray-900">
                              {r.name}
                            </div>
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
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 text-[12px] text-gray-600">
            Showing <span className="font-semibold">{filtered.length}</span> of{" "}
            <span className="font-semibold">{unionAll.length}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 -mx-px flex items-center gap-3 border-t border-gray-200 bg-white/90 px-6 py-3 backdrop-blur">
          <div className="text-[12px] text-gray-600">
            <span className="rounded-full bg-red-50 ring-1 ring-red-100 px-2 py-0.5 text-red-700">
              {selectedGroups.length} group(s)
            </span>
            <span className="ml-2 rounded-full bg-gray-50 ring-1 ring-gray-200 px-2 py-0.5 text-gray-700">
              {selectedDeviceIds.length} screen(s)
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm font-medium px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-500 transition"
            >
              Cancel
            </button>

            {onConfirm && (
              <button
                disabled={submitting}
                onClick={async () => {
                  try {
                    setSubmitting(true);

                    // A) keep chips selection in slice
                    const groupObjs = (selectedGroups ?? []).map((gid) => {
                      const g = (groups ?? []).find(
                        (x) => String(x.id) === String(gid)
                      );
                      return { id: gid, name: g?.name ?? String(gid) };
                    });
                    const screenObjs = (selectedDeviceIds ?? []).map((sid) => {
                      const s = (screens ?? []).find(
                        (x: any) => String(getScreenKey(x)) === String(sid)
                      );
                      return { id: sid, name: s?.name ?? `Screen #${sid}` };
                    });
                    dispatch(
                      setReservedSelection({
                        groups: groupObjs,
                        screens: screenObjs,
                      })
                    );

                    // B) build API payload
                    const payload = {
                      screens: (selectedDeviceIds ?? [])
                        .map((id) => Number(id))
                        .filter((n) => Number.isFinite(n))
                        .map((screenId) => ({ screenId })),
                      groups: (selectedGroups ?? [])
                        .map((id) => Number(id))
                        .filter((n) => Number.isFinite(n))
                        .map((groupId) => ({ groupId })),
                    };

                    // C) call API
                    const apiRes = await postGetScheduleDetails(payload);

                    // D) map & upsert into store
                    const blocks = mapApiToReservedBlocks(apiRes);
                    if (blocks.length) dispatch(upsertMany(blocks));

                    // E) parent callback
                    onConfirm({
                      selectedGroups,
                      selectedDevices: selectedDeviceIds,
                    });

                    // F) close
                    onClose();
                  } catch (err) {
                    console.error(
                      "[SelectDevicesModel] get schedule details failed:",
                      err
                    );
                    // TODO: toast error if you have a system
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className={[
                  "text-sm font-semibold px-4 py-2 rounded-md transition",
                  submitting
                    ? "bg-red-300 text-white cursor-not-allowed"
                    : "bg-red-500 text-white hover:opacity-90",
                ].join(" ")}
              >
                {submitting ? "Loading…" : "Done"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectDevicesModel;
