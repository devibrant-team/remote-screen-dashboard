// src/Screens/Schedule/ScreenSchedule.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Check, Monitor, RefreshCw, Search, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import {
  setScreens,
  type Screen as SliceScreen,
} from "../../Redux/ScreenManagement/ScreenSlice";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";

type Props = {
  blockId?: string;
  onDone?: () => void; // kept for backward compat, not used when controlled
  value?: Array<{ id: number | string }>;
  onChange?: (sel: Array<{ id: number | string }>) => void;
};

const chip = (ok?: boolean) =>
  ok
    ? "bg-green-100 text-green-700 ring-1 ring-green-200"
    : "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

const ScreenSchedule: React.FC<Props> = ({ blockId, onDone, value, onChange }) => {
  const controlled = typeof onChange === "function";

  const {
    data: apiScreens,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetScreen();

  const dispatch = useDispatch();

  const list = useSelector((s: RootState) => s.screens.items) as SliceScreen[];

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Array<{ id: number | string }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // hydrate Redux from API once
  useEffect(() => {
    if (!list.length && Array.isArray(apiScreens) && apiScreens.length) {
      dispatch(setScreens(apiScreens as unknown as SliceScreen[]));
    }
  }, [list.length, apiScreens, dispatch]);

  // when uncontrolled, hydrate from block
  const block = useSelector((s: RootState) =>
    s.schedule.blocks.find((b) => b.id === blockId)
  );
  useEffect(() => {
    if (controlled) return; // parent owns state
    if (!blockId) {
      setSelected([]);
      return;
    }
    const saved = block?.screens ?? [];
    setSelected(saved.map((s) => ({ id: s.screenId })));
  }, [controlled, blockId, block?.screens]);

  const current = controlled ? value ?? [] : selected;
  const setCurrent = (next: Array<{ id: number | string }>) =>
    controlled ? onChange?.(next) : setSelected(next);

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((s) =>
      [s.name, s.branch, s.ratio, s.id, s.screenId]
        .filter(Boolean)
        .map(String)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [list, query]);

  const toggle = (id: number | string) =>
    setCurrent(
      current.some((x) => String(x.id) === String(id))
        ? current.filter((x) => String(x.id) !== String(id))
        : [...current, { id }]
    );

  const selectAll = () => setCurrent(filtered.map((s) => ({ id: s.id })));
  const clearAll = () => setCurrent([]);

  return (
    <section className="w-full">
      {/* Header (unchanged) */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Select Screens</h2>
            <p className="text-xs text-gray-500">Choose one or more screens.</p>
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
                const fresh = res?.data;
                if (Array.isArray(fresh)) {
                  dispatch(setScreens(fresh as unknown as SliceScreen[]));
                }
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
              {current.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              disabled={!filtered.length}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Select all
            </button>
            <button
              onClick={clearAll}
              disabled={!current.length}
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
                  // (kept only if you still use this component standalone)
                  // dispatch(updateBlockParts({ id: blockId, screens: current.map(s => ({ screenId: s.id })) }));
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
          {filtered.map((s) => {
            const isSelected = current.some((x) => String(x.id) === String(s.id));
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
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
                    <div
                      className={[
                        "grid h-12 w-12 place-items-center rounded-xl",
                        s.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-700",
                      ].join(" ")}
                    >
                      <Monitor className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {s.name || `Screen #${s.id}`}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        ID: {s.id}
                        {typeof s.screenId !== "undefined" ? ` · HW: ${s.screenId}` : ""}
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

export default ScreenSchedule;
