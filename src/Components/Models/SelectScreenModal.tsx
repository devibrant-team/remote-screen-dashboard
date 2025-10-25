import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UsersRound,
  Monitor,
  Layers,
  BadgeCheck,
  Check,
} from "lucide-react";

import BaseModal from "./BaseModal";

import {
  setScreens,
  type Screen as SliceScreen,
  toggleSelectedDevice,
  selectSelectedDevices,
} from "../../Redux/ScreenManagement/ScreenSlice";

import {
  setGroups,
  type Group,
  selectGroups,
  toggleSelectedGroup,           // <-- NEW
  selectSelectedGroups,         // <-- NEW
} from "../../Redux/ScreenManagement/GroupSlice";

import type { RootState } from "../../../store";

import { useGetGroups } from "../../ReactQuery/Group/GetGroup";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";
import { useGetSchedulesByTargets } from "../../ReactQuery/Schedule/GetScheduleBlocks";

type FilterMode = "all" | "groups" | "screens";

type SelectScreenModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirmNavigate?: () => void;
};

const SelectScreenModal: React.FC<SelectScreenModalProps> = ({
  open,
  onClose,
  onConfirmNavigate,
}) => {
  const dispatch = useDispatch();

  // ---- Redux data ----
  const groups = useSelector(selectGroups) as Group[];
  const screens = useSelector(
    (s: RootState) => s.screens.items
  ) as SliceScreen[];

  // selected IDs live in Redux now
  const selectedDevices = useSelector(selectSelectedDevices);   // screens []
  const selectedGroups = useSelector(selectSelectedGroups);     // groups  []

  // ---- Fetch from API (hydrates Redux lists if empty) ----
  const { data: apiGroups } = useGetGroups();
  const { data: apiScreens } = useGetScreen();

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

  // ---- Local view state (filters only, not selection) ----
  const [mode, setMode] = useState<FilterMode>("all");
  const [onlyActive, setOnlyActive] = useState(false);

  // ---- Normalize both groups and screens into common Row[] ----
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
      const sid =
        (s as any).screenId ??
        (s as any).id ??
        (s as any)._id;

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

  // ---- Filter by mode + active toggle ----
  const filtered: Row[] = useMemo(() => {
    let list = unionAll;

    if (mode === "groups") {
      list = list.filter((r) => r.kind === "group");
    } else if (mode === "screens") {
      list = list.filter((r) => r.kind === "screen");
    }

    if ((mode === "screens" || mode === "all") && onlyActive) {
      list = list.filter((r) =>
        r.kind === "screen" ? !!r.active : true
      );
    }

    return list;
  }, [unionAll, mode, onlyActive]);

  // ---- Toggle selection ----
  const handleToggleRow = (row: Row) => {
    if (row.kind === "group") {
      dispatch(toggleSelectedGroup(row.id));      // <-- redux
    } else {
      dispatch(toggleSelectedDevice(row.id));     // <-- redux
    }
  };

  // ---- Is row selected? ----
  const rowIsSelected = (row: Row) => {
    if (row.kind === "group") {
      return selectedGroups.some(
        (gid) => String(gid) === String(row.id)
      );
    } else {
      return selectedDevices.some(
        (sid) => String(sid) === String(row.id)
      );
    }
  };

  // ---- React Query mutation to GET schedules for chosen targets ----
  const scheduleQueryMutation = useGetSchedulesByTargets();

  // ---- Confirm button ----
  const handleConfirm = () => {
    const finalGroupIds = selectedGroups;   // already array from redux
    const finalScreenIds = selectedDevices; // already array from redux

    scheduleQueryMutation.mutate({
      groups: finalGroupIds,
      screens: finalScreenIds,
    });

    onClose();
    if (onConfirmNavigate) {
      onConfirmNavigate();
    }
  };

  // ---- Render ----
  return (
    <BaseModal open={open} onClose={onClose} title="Select Target Display">
      {/* Intro */}
      <div className="text-[13px] text-gray-600 mb-4 leading-snug">
        Choose where this schedule will play. You can assign to multiple groups
        and multiple screens.
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        )}
      </div>

      {/* Cards grid */}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.map((r) => {
          const isSelected = rowIsSelected(r);

          return (
            <li key={`${r.kind}-${r.id}`}>
              <button
                type="button"
                onClick={() => handleToggleRow(r)}
                className={[
                  "group relative w-full overflow-hidden rounded-xl border bg-white p-3 text-left transition",
                  isSelected
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
                ].join(" ")}
              >
                {/* check bubble */}
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

                <div className="flex items-center gap-2">
                  {/* icon */}
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

                  {/* text/meta */}
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

                  {/* badge */}
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

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {/* summary */}
        <div className="text-[11px] text-gray-500 sm:mr-auto">
          <span className="rounded-full bg-red-50 ring-1 ring-red-100 px-2 py-0.5 text-red-700">
            {selectedGroups.length} group(s)
          </span>
          <span className="ml-2 rounded-full bg-gray-50 ring-1 ring-gray-200 px-2 py-0.5 text-gray-700">
            {selectedDevices.length} screen(s)
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-sm font-medium px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-500 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleConfirm}
          disabled={
            selectedGroups.length === 0 && selectedDevices.length === 0
          }
          className={`text-sm font-semibold px-4 py-2 rounded-md transition ${
            selectedGroups.length === 0 && selectedDevices.length === 0
              ? "bg-gray-300 text-white cursor-not-allowed"
              : "bg-red-500 text-white hover:opacity-90"
          }`}
        >
          {scheduleQueryMutation.isPending ? "Loading..." : "Use selection"}
        </button>
      </div>
    </BaseModal>
  );
};

export default SelectScreenModal;
