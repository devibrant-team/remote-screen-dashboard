// src/Screens/Schedule/GroupSchedule.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Check, UsersRound, RefreshCw, Search, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { setGroups, selectGroups, type Group } from "../../Redux/ScreenManagement/GroupSlice";
import { useGetGroups } from "../../ReactQuery/Group/GetGroup";

type Props = {
  blockId?: string;
  onDone?: () => void; // kept for backward compat, not used when controlled
  value?: number | string | null;
  onChange?: (id: number | string | null) => void;
};

const GroupSchedule: React.FC<Props> = ({ blockId, onDone, value, onChange }) => {
  const controlled = typeof onChange === "function";

  const dispatch = useDispatch();
  const { data: apiGroups, isLoading, isError, refetch } = useGetGroups();
  const list = useSelector(selectGroups) as Group[];

  useEffect(() => {
    if (!list.length && Array.isArray(apiGroups) && apiGroups.length) {
      dispatch(setGroups(apiGroups as Group[]));
    }
  }, [list.length, apiGroups, dispatch]);

  // when uncontrolled, hydrate from block
  const block = useSelector((s: RootState) =>
    s.schedule.blocks.find((b) => b.id === blockId)
  );

  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (controlled) return; // parent owns
    if (!blockId) {
      setSelectedId(null);
      return;
    }
    const saved = (block as any)?.groupId;
    setSelectedId(typeof saved !== "undefined" ? saved : null);
  }, [controlled, blockId, block?.groupId]);

  const current = controlled ? (typeof value !== "undefined" ? value : null) : selectedId;
  const setCurrent = (next: number | string | null) =>
    controlled ? onChange?.(next) : setSelectedId(next);

  const [query, setQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((g: Group) =>
      [g.name, g.branchName, g.ratio, g.id, g.screenNumber]
        .filter(Boolean)
        .map(String)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [list, query]);

  const toggle = (id: number | string) =>
    setCurrent(String(current) === String(id) ? null : id);

  const clear = () => setCurrent(null);

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Select a Group</h2>
            <p className="text-xs text-gray-500">Choose one group for this block.</p>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2 md:max-w-lg md:self-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, branch, ratio, ID…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              try {
                const res = await refetch();
                const fresh = (res as any)?.data;
                if (Array.isArray(fresh)) dispatch(setGroups(fresh as Group[]));
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {!!list.length && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              {current != null ? 1 : 0} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clear}
              disabled={current == null}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Clear
            </button>

            {/* Hide per-tab Apply when controlled by parent */}
            {!controlled && (
              <button
                onClick={() => {
                  if (!blockId) return;
                  // legacy: save immediately when not controlled
                  // dispatch(updateBlockParts({ id: blockId, groupId: current ?? undefined }));
                  onDone?.();
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                disabled={!blockId}
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {!!list.length && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((g: Group) => {
            const isSelected = current != null && String(current) === String(g.id);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  className={[
                    "group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition",
                    isSelected
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-gray-200 hover:border-gray-300 hover:shadow",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border transition",
                      isSelected
                        ? "bg-red-500 border-red-600 text-white"
                        : "bg-white border-gray-200 text-gray-400 group-hover:text-gray-500",
                    ].join(" ")}
                    aria-hidden
                  >
                    <Check className="h-4 w-4" />
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <UsersRound className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {g.name}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        ID: {g.id}
                        {typeof g.screenNumber !== "undefined" ? ` · Screens: ${g.screenNumber}` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default GroupSchedule;
