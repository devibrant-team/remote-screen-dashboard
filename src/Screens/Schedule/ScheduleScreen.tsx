// src/Screens/Schedule/ScheduleScreen.tsx
import React from "react";
import { useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Monitor, Layers, Hash, ArrowUpAZ, ArrowDownZA } from "lucide-react";

import {
  selectScheduleItemScreens,
  selectScheduleItemGroups,
  selectScheduleItemBlocks,
  selectSelectedScreenId as selectSelectedScreenIdStr,
  selectSelectedGroupId as selectSelectedGroupIdStr,
  setSelectedScreenId,
  setSelectedGroupId,
} from "../../Redux/ScheduleItem/ScheduleItemSlice";

/* ------------------------------- Types ---------------------------------- */
type SortKey = "name-asc" | "name-desc" | "count-desc" | "count-asc";

/* ------------------------------- UI Bits -------------------------------- */
const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200">
      <Hash className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-semibold text-zinc-800">{title}</h3>
    {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
  </div>
);

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}> = ({ icon, title, actions }) => (
  <div className="mb-3 flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">
        {icon}
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);

const CountPill: React.FC<{ n: number; selected?: boolean }> = ({ n, selected }) => (
  <span
    className={
      "rounded-full px-2.5 py-1 text-xs font-medium transition " +
      (selected
        ? "border border-red-300 bg-red-100 text-red-800"
        : n > 0
        ? "border border-red-200 bg-red-50 text-red-700"
        : "border border-zinc-200 bg-zinc-50 text-zinc-700")
    }
  >
    {n} block{n === 1 ? "" : "s"}
  </span>
);

const CardButton: React.FC<
  React.PropsWithChildren<{ selected?: boolean; onClick?: () => void; title?: string }>
> = ({ selected, onClick, children, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    aria-pressed={!!selected}
    className={
      "group relative w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition " +
      (selected
        ? "border-red-500 ring-2 ring-red-500/30"
        : "border-zinc-200 hover:-translate-y-0.5 hover:shadow-md")
    }
  >
    {children}
  </button>
);

/* --------------------------------- Main --------------------------------- */


const ScheduleScreen: React.FC = () => {
  const dispatch = useDispatch();



  const screens = useSelector(selectScheduleItemScreens);
  const groups = useSelector(selectScheduleItemGroups);
  const blocks = useSelector(selectScheduleItemBlocks);

  // Selected IDs live in Redux as strings; convert to number|null for UI compare
  const selectedScreenIdStr = useSelector(selectSelectedScreenIdStr);
  const selectedGroupIdStr = useSelector(selectSelectedGroupIdStr);
  const selectedScreenId = selectedScreenIdStr != null ? Number(selectedScreenIdStr) : null;
  const selectedGroupId = selectedGroupIdStr != null ? Number(selectedGroupIdStr) : null;


 
  // Build frequency maps for counts
  const { screenCountMap, groupCountMap } = useMemo(() => {
    const screenMap = new Map<number, number>();
    const groupMap = new Map<number, number>();
    for (const b of blocks ?? []) {
      for (const s of (b as any)?.screens ?? []) {
        const id = typeof s?.id === "number" ? s.id : Number(s?.id);
        if (!Number.isFinite(id)) continue;
        screenMap.set(id, (screenMap.get(id) ?? 0) + 1);
      }
      for (const g of (b as any)?.groups ?? []) {
        const id = typeof g?.id === "number" ? g.id : Number(g?.id);
        if (!Number.isFinite(id)) continue;
        groupMap.set(id, (groupMap.get(id) ?? 0) + 1);
      }
    }
    return { screenCountMap: screenMap, groupCountMap: groupMap };
  }, [blocks]);

  const sortItems = <T extends { id: number; name: string }>(
    arr: T[],
    sortKey: SortKey,
    countMap: Map<number, number>
  ): T[] => {
    const cloned = [...arr];
    cloned.sort((a, b) => {
      const ca = countMap.get(a.id) ?? 0;
      const cb = countMap.get(b.id) ?? 0;
      switch (sortKey) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "count-asc":
          return ca - cb || (a.name || "").localeCompare(b.name || "");
        case "count-desc":
        default:
          return cb - ca || (a.name || "").localeCompare(b.name || "");
      }
    });
    return cloned;
  };


  /* ------------------- Mutually-exclusive selection ------------------- */
  const handleSelectScreen = useCallback(
    (id: number) => {
      const next = selectedScreenId === id ? null : id;

     

      // Set screen, clear group in Redux
      dispatch(setSelectedScreenId(next == null ? null : String(next)));
      dispatch(setSelectedGroupId(null));
    },
    [dispatch, selectedScreenId, selectedGroupId]
  );

  const handleSelectGroup = useCallback(
    (id: number) => {
      const next = selectedGroupId === id ? null : id;

      

      // Set group, clear screen in Redux
      dispatch(setSelectedGroupId(next == null ? null : String(next)));
      dispatch(setSelectedScreenId(null));
    },
    [dispatch, selectedScreenId, selectedGroupId]
  );

  return (
    <div className="space-y-8 mt-5 overflow-y-auto scrollbar-hide ">
      {/* Screens */}
      <section>
        <SectionHeader
          icon={<Monitor className="h-5 w-5 text-zinc-700" />}
          title="Screens"
        />

        {(screens?.length ?? 0) === 0 ? (
          <EmptyState title="No screens yet" hint="Load a schedule item with blocks to see related screens." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {screens.map((s) => {
              const c = screenCountMap.get(s.id) ?? 0;
              const selected = selectedScreenId === s.id;
              return (
                <CardButton
                  key={s.id}
                  selected={selected}
                  onClick={() => handleSelectScreen(s.id)}
                  title={selected ? "Selected" : "Select screen"}
                >
                  <div className="flex min-h-[56px] items-center justify-between gap-4">
                    {/* left */}
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">
                        <Monitor className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {s.name || `Screen #${s.id}`}
                        </div>
                        <div className="text-xs text-zinc-500">ID: {s.id}</div>
                      </div>
                    </div>
                    {/* center-right count */}
                    <div className="self-center">
                      <CountPill n={c} selected={selected} />
                    </div>
                  </div>
                </CardButton>
              );
            })}
          </div>
        )}
      </section>

      {/* Groups */}
      <section>
        <SectionHeader
          icon={<Layers className="h-5 w-5 text-zinc-700" />}
          title="Groups"
       
        />

        {(groups?.length ?? 0) === 0 ? (
          <EmptyState title="No groups yet" hint="When blocks include groups, they’ll appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-3 mb-5">
            {groups.map((g) => {
              const c = groupCountMap.get(g.id) ?? 0;
              const selected = selectedGroupId === g.id;
              return (
                <CardButton
                  key={g.id}
                  selected={selected}
                  onClick={() => handleSelectGroup(g.id)}
                  title={selected ? "Selected" : "Select group"}
                >
                  <div className="flex min-h-[56px] items-center justify-between gap-4">
                    {/* left */}
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">
                        <Layers className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {g.name || `Group #${g.id}`}
                        </div>
                        <div className="text-xs text-zinc-500">ID: {g.id}</div>
                      </div>
                    </div>
                    {/* center-right count */}
                    <div className="self-center">
                      <CountPill n={c} selected={selected} />
                    </div>
                  </div>
                </CardButton>
              );
            })}
          </div>
        )}
      </section>
      <div className="py-5">

      </div>
    </div>
  );
};

export default ScheduleScreen;
