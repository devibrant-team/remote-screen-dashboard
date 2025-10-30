import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  ChevronRight,
  Search,
  Loader2,
  Trash2,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { useGetScheduleItem } from "../../../Redux/ScheduleItem/GetScheduleItem";
import { useRenameScheduleItem } from "../../../Redux/ScheduleItem/RenameScheduleItem";
import { useDeleteScheduleItem } from "../../../Redux/ScheduleItem/DeleteScheduleItem";
import { useDispatch } from "react-redux";
import {
  setScheduleItem,
  setScheduleItemBlocks,
  clearScheduleItemBlocks,
} from "../../../Redux/ScheduleItem/ScheduleItemSlice";

import { primeScheduleItemBlocksCache } from "../../../Redux/ScheduleItem/GetScheduleItemBlocks";
import { useQueryClient } from "@tanstack/react-query";
import SelectDevicesModel from "../SelectDevicesModel";
import { useNavigate } from "react-router-dom";
type Row = { id: string; name: string; modifiedAtISO: string };

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" ", "");
  return `${date.replace(" ", " , ")} - ${time}`;
};

const RENAME_INPUT_CLS =
  "w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-red-400 placeholder:text-red-400 text-gray-900";

const ScheduleItem: React.FC = () => {
  const { data = [], isLoading, isError, refetch } = useGetScheduleItem();
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const [displayRows, setDisplayRows] = useState<Row[]>([]);
const navigate = useNavigate();
  useEffect(() => {
    if (!Array.isArray(data)) return;

    setDisplayRows((prev) => {
      if (prev.length !== data.length) return data;

      // shallow content compare (id+name+modifiedAtISO)
      for (let i = 0; i < prev.length; i++) {
        const a = prev[i],
          b = data[i];
        if (
          !b ||
          a.id !== b.id ||
          a.name !== b.name ||
          a.modifiedAtISO !== b.modifiedAtISO
        ) {
          return data;
        }
      }
      // same content → keep previous state (no re-render)
      return prev;
    });
  }, [data]);

  const [query, setQuery] = useState("");
  const [openWizard, setOpenWizard] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 0);
  }, [renamingId]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  //  const screens = useSelector(selectScheduleItemScreens);
  // const groups  = useSelector(selectScheduleItemGroups);
  //       useEffect(() => {
  //         console.log("[Redux] screens (derived):", screens , "GROUPS" ,groups);
  //       }, [screens]);
  // ✅ hooks
  const { mutateAsync: renameScheduleItem, isPending: isRenaming } =
    useRenameScheduleItem();
  const { mutateAsync: deleteScheduleItem, isPending: isDeleting } =
    useDeleteScheduleItem();

  const visible = useMemo(() => {
    if (!query.trim()) return displayRows;
    const q = query.trim().toLowerCase();
    return displayRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [displayRows, query]);

  const startInlineRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };
  const cancelInlineRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const confirmRename = async () => {
    if (!renamingId || !renameValue.trim()) return;
    const newName = renameValue.trim();
    const prev = displayRows;

    // optimistic
    setDisplayRows((rows) =>
      rows.map((r) =>
        r.id === renamingId
          ? { ...r, name: newName, modifiedAtISO: new Date().toISOString() }
          : r
      )
    );
    try {
      await renameScheduleItem({ id: renamingId, name: newName });
      // list will refetch via invalidate
    } catch (e) {
      setDisplayRows(prev); // rollback
      console.error(e);
    } finally {
      setRenamingId(null);
      setRenameValue("");
    }
  };

  const handleSelect = async (r: Row) => {
    // set selected schedule meta
    dispatch(setScheduleItem({ id: r.id, name: r.name }));

    // (optional) clear previous blocks immediately to avoid stale UI
    dispatch(clearScheduleItemBlocks());

    try {
      // fetch + prime cache + get data
      const blocks = await primeScheduleItemBlocksCache(qc, r.id);
      console.log("[Blocks for schedule]", r.id, blocks);

      // ✅ save blocks in Redux
      dispatch(setScheduleItemBlocks(blocks));
    } catch (e) {
      console.error("Failed to fetch blocks:", e);
    }
    navigate('/calender')
  };

  const askDelete = (id: string) => setDeletingId(id);

  // ✅ server delete with optimistic removal + rollback
  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    const prev = displayRows;

    // optimistic remove
    setDisplayRows((rows) => rows.filter((r) => r.id !== id));

    try {
      await deleteScheduleItem({ id });
      // onSuccess invalidates ["scheduleItems"] (from your hook) and refreshes
    } catch (e) {
      setDisplayRows(prev); // rollback
      console.error("Delete failed:", e);
    } finally {
      setDeletingId(null); // close modal whether success or fail
    }
  };

  const onRenameKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") confirmRename();
    if (e.key === "Escape") cancelInlineRename();
  };

  return (
    <>
      <section className="w-full mt-5 px-5">
        <div className="w-full border-b border-gray-200 bg-white px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-center">
            <h2 className="text-lg font-semibold text-gray-900">Schedules</h2>
            <div className="flex w-full items-center gap-2 sm:justify-end">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full rounded-md border border-gray-300 bg-white pl-8 pr-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <button
                type="button"
                onClick={() => setOpenWizard(true)}
                className="inline-flex items-center gap-2 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create New
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {isLoading && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading schedules…
              </div>
              <div className="mt-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load schedules.
              <button
                className="ml-2 font-semibold underline"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                No schedules found
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {query
                  ? "Try a different search term."
                  : "Start by creating a new schedule."}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setOpenWizard(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Create New
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && visible.length > 0 && (
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 text-sm text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Modified at</th>
                      <th className="px-3 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {visible.map((r) => {
                      const isEditing = renamingId === r.id;
                      return (
                        <tr
                          key={r.id}
                          className={`group border-t border-gray-100 hover:bg-gray-50/60 ${
                            isEditing ? "bg-red-50/50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  ref={renameInputRef}
                                  value={renameValue}
                                  onChange={(e) =>
                                    setRenameValue(e.target.value)
                                  }
                                  onKeyDown={onRenameKeyDown}
                                  disabled={isRenaming}
                                  className={`${RENAME_INPUT_CLS} disabled:opacity-60`}
                                  placeholder="New name"
                                  aria-label="Rename schedule"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSelect(r)}
                                className="w-full text-left"
                                title="Open schedule"
                              >
                                <div className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200 transition group-hover:ring-gray-300">
                                  <div className="truncate font-medium text-gray-900">
                                    {r.name}
                                  </div>
                                </div>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {fmtDateTime(r.modifiedAtISO)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={confirmRename}
                                    disabled={isRenaming}
                                    className="rounded p-2 text-white bg-red-500 hover:opacity-90 disabled:opacity-60"
                                    title="Save"
                                    aria-label="Save rename"
                                  >
                                    {isRenaming ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={cancelInlineRename}
                                    disabled={isRenaming}
                                    className="rounded p-2 hover:bg-gray-100 disabled:opacity-60"
                                    title="Cancel"
                                    aria-label="Cancel rename"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSelect(r)}
                                    className="rounded p-2 hover:bg-gray-100"
                                    title="Open"
                                    aria-label="Open"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      startInlineRename(r.id, r.name)
                                    }
                                    className="rounded p-2 hover:bg-gray-100"
                                    title="Rename"
                                    aria-label="Rename"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => askDelete(r.id)}
                                    className="rounded p-2 text-red-600 hover:bg-red-50"
                                    title="Delete"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && !isError && visible.length > 0 && (
            <div className="grid gap-2 md:hidden">
              {visible.map((r) => {
                const isEditing = renamingId === r.id;
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${
                      isEditing ? "bg-red-50/60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={onRenameKeyDown}
                            disabled={isRenaming}
                            className={`${RENAME_INPUT_CLS} disabled:opacity-60`}
                            placeholder="New name"
                            aria-label="Rename schedule"
                          />
                        ) : (
                          <button
                            onClick={() => handleSelect(r)}
                            className="min-w-0 text-left"
                            title="Open"
                          >
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {r.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {fmtDateTime(r.modifiedAtISO)}
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={confirmRename}
                              disabled={isRenaming}
                              className="rounded p-2 text-white bg-red-500 hover:opacity-90 disabled:opacity-60"
                              title="Save"
                              aria-label="Save rename"
                            >
                              {isRenaming ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelInlineRename}
                              disabled={isRenaming}
                              className="rounded p-2 hover:bg-gray-100 disabled:opacity-60"
                              title="Cancel"
                              aria-label="Cancel rename"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelect(r)}
                              className="rounded p-2 hover:bg-gray-100"
                              title="Open"
                              aria-label="Open"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => startInlineRename(r.id, r.name)}
                              className="rounded p-2 hover:bg-gray-100"
                              title="Rename"
                              aria-label="Rename"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => askDelete(r.id)}
                              className="rounded p-2 text-red-600 hover:bg-red-50"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ✅ Confirmation modal (Are you sure?) */}
      {deletingId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Delete schedule?
              </h3>
              <button
                onClick={() => setDeletingId(null)}
                className="rounded p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              This action can’t be undone. The schedule will be permanently
              removed.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      <SelectDevicesModel
        open={openWizard}
        onClose={() => setOpenWizard(false)}
        onConfirm={(payload) => {
          console.log("[Create New] Selected targets:", payload);
          // Example: dispatch to store or start creation wizard step
          // dispatch(setPendingTargets(payload))
          setOpenWizard(false);
        }}
      />
    </>
  );
};

export default ScheduleItem;
