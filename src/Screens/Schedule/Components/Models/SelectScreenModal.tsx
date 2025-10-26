// src/Screens/Schedule/Components/Models/SelectScreenModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UsersRound,
  Monitor,
  Layers,
  BadgeCheck,
  Check,
  X,
  Search,
} from "lucide-react";

import {
  setScreens,
  type Screen as SliceScreen,
  toggleSelectedDevice,
  selectSelectedDevices,
} from "../../../../Redux/ScreenManagement/ScreenSlice";

import {
  setGroups,
  type Group,
  selectGroups,
  toggleSelectedGroup,
  selectSelectedGroups,
} from "../../../../Redux/ScreenManagement/GroupSlice";

import type { RootState } from "../../../../../store";
import { useGetGroups } from "../../../../ReactQuery/Group/GetGroup";
import { useGetScreen } from "../../../../ReactQuery/Screen/GetScreen";
import BaseModal from "../../../../Components/Models/BaseModal";
import {
  postGetScheduleDetails,
  type GetScheduleDetailsPayload,
} from "../../../../Redux/Schedule/GetDevicesSchedule";
import { selectAllReservedBlocks, setReservedFromResponse } from "../../../../Redux/Schedule/ReservedBlockSlice";

type FilterMode = "all" | "groups" | "screens";

type SelectScreenModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirmNavigate?: () => void; // navigate to /schedule in parent
};

const SelectScreenModal: React.FC<SelectScreenModalProps> = ({
  open,
  onClose,
  onConfirmNavigate,
}) => {
  const dispatch = useDispatch();

  const groups = useSelector(selectGroups) as Group[];
  const screens = useSelector(
    (s: RootState) => s.screens.items
  ) as SliceScreen[];
  const selectedDevices = useSelector(selectSelectedDevices);
  const selectedGroups = useSelector(selectSelectedGroups);

  const { data: apiGroups, isLoading: loadingGroups } = useGetGroups();
  const { data: apiScreens, isLoading: loadingScreens } = useGetScreen();
  
  // hydrate store if empty
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

  const [mode, setMode] = useState<FilterMode>("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [query, setQuery] = useState("");
  const [isPosting, setIsPosting] = useState(false);
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
        id: sid,
        name: s.name || `Screen #${sid ?? "?"}`,
        branch: (s as any).branch,
        screenId: (s as any).screenId,
        active: (s as any).active ?? false,
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

  const handleToggleRow = (row: Row) => {
    if (row.kind === "group") dispatch(toggleSelectedGroup(row.id));
    else dispatch(toggleSelectedDevice(row.id));
  };
  const handleNext = async () => {
    if (selectedGroups.length === 0 && selectedDevices.length === 0) return;

    // Build payload (numbers only)
    const payload: GetScheduleDetailsPayload = {
      screens: (selectedDevices ?? [])
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n))
        .map((screenId) => ({ screenId })),
      groups: (selectedGroups ?? [])
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n))
        .map((groupId) => ({ groupId })),
    };

    try {
      setIsPosting(true);
      const res = await postGetScheduleDetails(payload);
      console.log("✅ GetScheduleDetailsApi response:", res);
      dispatch(setReservedFromResponse(res as any));
      // close + navigate after successful post
      onClose();
      onConfirmNavigate?.();
    } catch (err) {
      console.error("❌ GetScheduleDetailsApi error:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const rowIsSelected = (row: Row) =>
    row.kind === "group"
      ? selectedGroups.some((gid) => String(gid) === String(row.id))
      : selectedDevices.some((sid) => String(sid) === String(row.id));

  const selectedChips: Array<{
    label: string;
    kind: Row["kind"];
    id: string | number;
  }> = useMemo(() => {
    const m: Array<{
      label: string;
      kind: Row["kind"];
      id: string | number;
    }> = [];
    for (const gid of selectedGroups) {
      const g = groups.find((x) => String(x.id) === String(gid));
      if (g) m.push({ label: g.name, kind: "group", id: gid });
    }
    for (const sid of selectedDevices) {
      const s = screens.find(
        (x: any) => String(x.screenId ?? x.id ?? x._id) === String(sid)
      );
      if (s)
        m.push({ label: s.name || `Screen #${sid}`, kind: "screen", id: sid });
    }
    return m;
  }, [selectedGroups, selectedDevices, groups, screens]);

  const handleRemoveChip = (chip: {
    kind: Row["kind"];
    id: string | number;
  }) => {
    if (chip.kind === "group") dispatch(toggleSelectedGroup(chip.id));
    else dispatch(toggleSelectedDevice(chip.id));
  };

  const clearAllSelected = () => {
    selectedGroups.forEach((gid) => dispatch(toggleSelectedGroup(gid)));
    selectedDevices.forEach((sid) => dispatch(toggleSelectedDevice(sid)));
  };

  const isLoading = loadingGroups || loadingScreens;

  return (
    <BaseModal open={open} onClose={onClose} title="Create Schedule">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-semibold text-red-600">Select Targets</span>
      </div>

      {/* Controls */}
      <div className="sticky top-0 z-10 -mx-6 mb-3 border-b border-gray-200 bg-white/90 px-6 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            {(mode === "screens" || mode === "all") && (
              <button
                type="button"
                onClick={() => setOnlyActive((v) => !v)}
                className={[
                  "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition",
                  onlyActive
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
                title="Only active screens"
              >
                <BadgeCheck className="h-4 w-4" />
                Active
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Search by name, branch, ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 text-[12px] text-gray-600">
          Showing <span className="font-semibold">{filtered.length}</span> of{" "}
          <span className="font-semibold">{unionAll.length}</span>
        </div>
      </div>

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
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/5"
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
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
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
            Nothing here. Try adjusting filters or search.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                          : "bg-gray-50 text-gray-700 ring-gray-200",
                      ].join(" ")}
                    >
                      {r.kind === "group" ? "Group" : "Screen"}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer */}
      <div className="sticky bottom-0 mt-6 -mx-6 flex items-center gap-3 border-t border-gray-200 bg-white/90 px-6 py-3 backdrop-blur">
        <div className="text-[12px] text-gray-600">
          <span className="rounded-full bg-red-50 ring-1 ring-red-100 px-2 py-0.5 text-red-700">
            {selectedGroups.length} group(s)
          </span>
          <span className="ml-2 rounded-full bg-gray-50 ring-1 ring-gray-200 px-2 py-0.5 text-gray-700">
            {selectedDevices.length} screen(s)
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-sm font-medium px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-500 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleNext}
            disabled={
              isPosting ||
              (selectedGroups.length === 0 && selectedDevices.length === 0)
            }
            className={`text-sm font-semibold px-4 py-2 rounded-md transition ${
              isPosting ||
              (selectedGroups.length === 0 && selectedDevices.length === 0)
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-red-500 text-white hover:opacity-90"
            }`}
          >
            {isPosting ? "Loading…" : "Next"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default SelectScreenModal;
