import React, { useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Monitor, Layers, Hash } from "lucide-react";
import {
  selectAllReservedBlocks,
  selectReservedSelectedScreens,
  selectReservedSelectedGroups,
  selectFocusedScreenId,
  selectFocusedGroupId,
  selectReservedBlockforScreen,
  selectReservedBlockforGroup,
  setFocusedScreenAndCompute,
  setFocusedGroupAndCompute,
} from "../../../../Redux/ReservedBlocks/ReservedBlocks";

/* ------------------------------- Debug ---------------------------------- */
const DEBUG = true; // ← set false to mute logs
const log = (...args: any[]) => {
  if (DEBUG) console.log("%c[ScheduleScreen]", "color:#2563eb", ...args);
};

/* ------------------------------- Types ---------------------------------- */
type SimpleNamed = { id: number; name: string };

/* ------------------------------- UI Bits -------------------------------- */
const EmptyState: React.FC<{ title: string; hint?: string }> = ({
  title,
  hint,
}) => (
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
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);

const CountPill: React.FC<{ n: number }> = ({ n }) => (
  <span className="rounded-full px-2.5 py-1 text-xs font-medium border border-zinc-200 bg-zinc-50 text-zinc-700">
    {n} block{n === 1 ? "" : "s"}
  </span>
);

const CardButton: React.FC<
  React.PropsWithChildren<{ onClick?: () => void; active?: boolean }>
> = ({ onClick, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      "group relative w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition " +
      (active
        ? "border-red-500 ring-2 ring-red-500/25"
        : "border-zinc-200 hover:-translate-y-0.5 hover:shadow-md")
    }
  >
    {children}
  </button>
);

/* --------------------------------- Main --------------------------------- */

const ReservedScheduleScreen: React.FC = () => {
  const dispatch = useDispatch();

  // slice state
  const blocks = useSelector(selectAllReservedBlocks);
  const selectedScreensRaw = useSelector(selectReservedSelectedScreens);
  const selectedGroupsRaw = useSelector(selectReservedSelectedGroups);

  const focusedScreenId = useSelector(selectFocusedScreenId);
  const focusedGroupId = useSelector(selectFocusedGroupId);
  const focusedScreenBlocks = useSelector(selectReservedBlockforScreen);
  const focusedGroupBlocks = useSelector(selectReservedBlockforGroup);

  // normalize selected lists (display only)
  const screens: SimpleNamed[] = useMemo(
    () =>
      (selectedScreensRaw ?? [])
        .map((s) => ({
          id: typeof s.id === "number" ? s.id : Number(s.id),
          name: s.name ?? `Screen #${s.id}`,
        }))
        .filter((s) => Number.isFinite(s.id)),
    [selectedScreensRaw]
  );

  const groups: SimpleNamed[] = useMemo(
    () =>
      (selectedGroupsRaw ?? [])
        .map((g) => ({
          id: typeof g.id === "number" ? g.id : Number(g.id),
          name: g.name ?? `Group #${g.id}`,
        }))
        .filter((g) => Number.isFinite(g.id)),
    [selectedGroupsRaw]
  );

  // counts for display on cards
  const screenCountMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const b of blocks ?? []) {
      for (const s of b?.screens ?? []) {
        const sid = typeof s?.id === "number" ? s.id : Number(s?.id);
        if (!Number.isFinite(sid)) continue;
        m.set(sid, (m.get(sid) ?? 0) + 1);
      }
    }
    return m;
  }, [blocks]);

  const groupCountMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const b of blocks ?? []) {
      for (const g of b?.groups ?? []) {
        const gid = typeof g?.id === "number" ? g.id : Number(g?.id);
        if (!Number.isFinite(gid)) continue;
        m.set(gid, (m.get(gid) ?? 0) + 1);
      }
    }
    return m;
  }, [blocks]);

  // lifecycle logs
  useEffect(() => {
    log("mount");
    return () => log("unmount");
  }, []);
  useEffect(() => {
    log("selected devices changed:", {
      screens: selectedScreensRaw,
      groups: selectedGroupsRaw,
    });
  }, [selectedScreensRaw, selectedGroupsRaw]);
  useEffect(() => {
    log(
      "focus:",
      { focusedScreenId, focusedGroupId },
      {
        screenBlocks: focusedScreenBlocks?.length ?? 0,
        groupBlocks: focusedGroupBlocks?.length ?? 0,
      }
    );
  }, [
    focusedScreenId,
    focusedGroupId,
    focusedScreenBlocks,
    focusedGroupBlocks,
  ]);

  return (
    <div className="space-y-8 mt-5 overflow-y-auto scrollbar-hide ">
      {/* Selected Screens (click to focus/toggle) */}
      <section>
        <SectionHeader
          icon={<Monitor className="h-5 w-5 text-zinc-700" />}
          title="Selected Screens"
        />

        {(screens?.length ?? 0) === 0 ? (
          <EmptyState
            title="No screens selected"
            hint="Pick screens in the Select Devices step."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {screens.map((s) => {
              const c = screenCountMap.get(s.id) ?? 0;
              const active = Number(focusedScreenId) === s.id;
              return (
                <CardButton
                  key={s.id}
                  active={active}
                  onClick={() => {
                    log(
                      "click screen → dispatch setFocusedScreenAndCompute:",
                      s.id
                    );
                    // toggling handled in reducer (same id → unselect)
                    dispatch(setFocusedScreenAndCompute(String(s.id)));
                  }}
                >
                  <div className="flex min-h-[56px] items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">
                        <Monitor className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {s.name}
                        </div>
                        <div className="text-xs text-zinc-500">ID: {s.id}</div>
                      </div>
                    </div>
                    <div className="self-center">
                      <CountPill n={c} />
                    </div>
                  </div>
                </CardButton>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Groups (click to focus/toggle) */}
      <section>
        <SectionHeader
          icon={<Layers className="h-5 w-5 text-zinc-700" />}
          title="Selected Groups"
        />
        {(groups?.length ?? 0) === 0 ? (
          <EmptyState
            title="No groups selected"
            hint="Pick groups in the Select Devices step."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 mb-5">
            {groups.map((g) => {
              const c = groupCountMap.get(g.id) ?? 0;
              const active = Number(focusedGroupId) === g.id;
              return (
                <CardButton
                  key={g.id}
                  active={active}
                  onClick={() => {
                    log(
                      "click group → dispatch setFocusedGroupAndCompute:",
                      g.id
                    );
                    // toggling handled in reducer (same id → unselect)
                    dispatch(setFocusedGroupAndCompute(String(g.id)));
                  }}
                >
                  <div className="flex min-h-[56px] items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">
                        <Layers className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {g.name}
                        </div>
                        <div className="text-xs text-zinc-500">ID: {g.id}</div>
                      </div>
                    </div>
                    <div className="self-center">
                      <CountPill n={c} />
                    </div>
                  </div>
                </CardButton>
              );
            })}
          </div>
        )}
      </section>

      <div className="py-5" />
    </div>
  );
};

export default ReservedScheduleScreen;
