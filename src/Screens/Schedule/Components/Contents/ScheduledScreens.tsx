// src/Screens/Schedule/ScheduledScreens.tsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Monitor, Search, CalendarClock, UsersRound } from "lucide-react";
import { selectAllReservedBlocks } from "../../../../Redux/Schedule/ReservedBlockSlice";
import { selectGroups } from "../../../../Redux/ScreenManagement/GroupSlice";
import type { RootState } from "../../../../../store";

/* helpers */
function getDeviceId(s: any): number | null {
  const raw = s?.screenId ?? s?.id ?? s?._id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function getGroupId(g: any): number | null {
  const raw = g?.groupId ?? g?.id ?? g?._id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type Props = { className?: string };

const ScheduledScreens: React.FC<Props> = ({ className }) => {
  const blocks = useSelector(selectAllReservedBlocks);

  // Enrichment from store
  const storeScreens =
    useSelector((s: RootState) => s.screens.items as any[] | undefined) ?? [];
  const storeGroups = useSelector(selectGroups) as any[]; // id, name, branchName, screenNumber…

  const [query, setQuery] = useState("");

  /* -------------------- Screens (unique) -------------------- */
  const screenIds = useMemo(() => {
    const set = new Set<number>();
    for (const b of blocks) for (const s of b.screens) {
      const id = Number(s.screenId);
      if (Number.isFinite(id)) set.add(id);
    }
    return Array.from(set);
  }, [blocks]);

  type ScreenRow = {
    id: number;
    name: string;
    branch?: string;
    active?: boolean;
    count: number;
  };

  const screenRows = useMemo<ScreenRow[]>(() => {
    const counts = new Map<number, number>();
    for (const b of blocks) for (const s of b.screens) {
      const id = Number(s.screenId);
      if (!Number.isFinite(id)) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    return screenIds.map((id) => {
      const sc = storeScreens.find((x) => getDeviceId(x) === id);
      return {
        id,
        name: sc?.name ?? `Screen #${id}`,
        branch: sc?.branch,
        active: !!sc?.active,
        count: counts.get(id) ?? 0,
      };
    });
  }, [blocks, screenIds, storeScreens]);

  /* -------------------- Groups (unique) -------------------- */
  const groupIds = useMemo(() => {
    const set = new Set<number>();
    for (const b of blocks) for (const g of b.groups) {
      const id = Number(g.groupId);
      if (Number.isFinite(id)) set.add(id);
    }
    return Array.from(set);
  }, [blocks]);

  type GroupRow = {
    id: number;
    name: string;
    branchName?: string;
    screenNumber?: number;
    count: number;
  };

  const groupRows = useMemo<GroupRow[]>(() => {
    const counts = new Map<number, number>();
    for (const b of blocks) for (const g of b.groups) {
      const id = Number(g.groupId);
      if (!Number.isFinite(id)) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    return groupIds.map((id) => {
      const gg = storeGroups.find((x) => getGroupId(x) === id);
      return {
        id,
        name: gg?.name ?? `Group #${id}`,
        branchName: gg?.branchName,
        screenNumber: gg?.screenNumber,
        count: counts.get(id) ?? 0,
      };
    });
  }, [blocks, groupIds, storeGroups]);

  /* -------------------- Filtering (shared search) -------------------- */
  const q = query.trim().toLowerCase();

  const filteredScreens = useMemo(
    () =>
      !q
        ? screenRows
        : screenRows.filter((r) =>
            `${r.name} ${r.branch ?? ""} ${r.id}`.toLowerCase().includes(q)
          ),
    [screenRows, q]
  );

  const filteredGroups = useMemo(
    () =>
      !q
        ? groupRows
        : groupRows.filter((r) =>
            `${r.name} ${r.branchName ?? ""} ${r.id}`.toLowerCase().includes(q)
          ),
    [groupRows, q]
  );

  /* -------------------- UI -------------------- */
  return (
    <div className={`flex h-full min-h-0 flex-col ${className ?? ""}`}>
      {/* Sticky header with search (applies to both sections) */}
      <div className="sticky top-0 z-[1] -mx-3 mb-2 border-b border-gray-100 bg-white/85 px-3 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-gray-900">
            Reserved targets
          </div>
          <div className="relative w-44">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-md border border-gray-300 bg-white pl-8 pr-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Search screens/groups…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Screens */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Screens with reservations
            </h3>
            <span className="text-[11px] text-gray-500">
              {filteredScreens.length}
            </span>
          </div>

          {filteredScreens.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
              <p className="text-sm text-gray-600">No screens to show.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredScreens.map((r) => (
                <li key={`scr-${r.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-gray-300 hover:shadow-sm">
                    <div
                      className={[
                        "grid h-9 w-9 place-items-center rounded-md",
                        r.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600",
                      ].join(" ")}
                      title={r.active ? "Active" : "Inactive"}
                    >
                      <Monitor className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-[13px] font-semibold text-gray-900">
                          {r.name}
                        </div>

                        {/* remove if you don't want counts */}
                        <span
                          className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-[2px] text-[10px] font-medium text-red-700 ring-1 ring-red-200"
                          title="Total reserved blocks for this screen"
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          {r.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Groups */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Groups with reservations
            </h3>
            <span className="text-[11px] text-gray-500">
              {filteredGroups.length}
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
              <p className="text-sm text-gray-600">No groups to show.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredGroups.map((g) => (
                <li key={`grp-${g.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-gray-300 hover:shadow-sm">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-red-50 text-red-700">
                      <UsersRound className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-[13px] font-semibold text-gray-900">
                          {g.name}
                        </div>
                        {/* remove if you don't want counts */}
                        <span
                          className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-[2px] text-[10px] font-medium text-red-700 ring-1 ring-red-200"
                          title="Total reserved blocks for this group"
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          {g.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default ScheduledScreens;
