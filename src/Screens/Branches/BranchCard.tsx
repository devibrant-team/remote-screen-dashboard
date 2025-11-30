import React, { useMemo, useState } from "react";
import {
  Building2,
  Pencil,
  Trash2,
  Monitor,
  Users,
  Plus,
  RefreshCw,
} from "lucide-react";
import { BRANCHES_QK, useGetBranches } from "@/ReactQuery/Branch/GetBranch";
import { useRenameBranch } from "@/ReactQuery/Branch/RenameBranch";
import { useDeleteBranch } from "@/ReactQuery/Branch/DeleteBranch";
import {
  BRANCHSCREEN_QK,
  useGetBranchScreen,
} from "@/ReactQuery/Branch/GetBranchScreen";
import type { IdLike } from "@/ReactQuery/Branch/GetBranchScreen";
import AddBranchModal from "../ScreenManagement/AddBranchModal";
import { useQueryClient } from "@tanstack/react-query";
import ErrorToast from "@/Components/ErrorToast";
import SuccessToast from "@/Components/SuccessToast";

const PAGE_SIZE = 4;

/* ------------------------ Types (loose) ------------------------ */

type BranchLike = {
  id: number | string;
  name?: string;
  [key: string]: any;
};

type ScreenLike = {
  id: number | string;
  name?: string;
  screenName?: string;
  screenId?: string | number;
  PlaylistName?: string | null;
  playlistName?: string | null;
  ratio?: string | null;
  isOnline?: boolean;
  group?: string | null;
  groupName?: string | null;
  [key: string]: any;
};

/* ----------------- Single Branch Card (memoized) ----------------- */

type BranchItemCardProps = {
  branch: BranchLike;
  isSelected: boolean;
  onSelect: () => void;

  // inline edit
  isEditing: boolean;
  editingName: string;
  onChangeEditingName: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  isRenaming: boolean;

  // delete
  onDelete: () => void;
  isDeleting: boolean;
};

const BranchItemCard = React.memo(function BranchItemCard({
  branch,
  isSelected,
  onSelect,
  isEditing,
  editingName,
  onChangeEditingName,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isRenaming,
  onDelete,
  isDeleting,
}: BranchItemCardProps) {
  return (
    <article
      className={`flex min-h-[150px] flex-col justify-between rounded-xl border p-4 shadow-sm outline-none transition sm:min-h-[170px] lg:p-5 ${
        isSelected
          ? "border-red-400 bg-red-50/40 ring-1 ring-red-200"
          : "border-neutral-200 bg-white hover:border-red-200 hover:bg-red-50/10"
      }`}
    >
      {/* Clickable header area (select branch) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className="mb-4 flex cursor-pointer items-start gap-3"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Building2 size={20} />
        </div>
        <div className="min-w-0">
          {isEditing ? (
            <input
              value={editingName}
              onChange={(e) => onChangeEditingName(e.target.value)}
              onKeyDown={(e) => {
                // prevent bubbling to header button
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSaveEdit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancelEdit();
                }
              }}
              autoFocus
              className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm font-semibold text-neutral-900 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 sm:text-base lg:text-lg"
              placeholder="Branch name"
            />
          ) : (
            <h3 className="max-w-full truncate text-sm font-semibold text-neutral-900 sm:text-base lg:text-lg">
              {branch.name || "Unnamed branch"}
            </h3>
          )}
          <p className="mt-0.5 text-[11px] text-neutral-500 sm:text-xs">
            ID: {branch.id}
          </p>
        </div>
      </div>

      {/* Actions (non-clickable for selection) */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {isEditing ? (
          <>
            <button
              type="button"
              disabled={isRenaming}
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit();
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 sm:text-sm lg:text-base"
            >
              {isRenaming ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={isRenaming}
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 sm:text-sm lg:text-base"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:text-sm lg:text-base"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 sm:text-sm lg:text-base"
            >
              <Trash2 size={16} />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </article>
  );
});

/* ----------------- Screens Panel (memoized) ----------------- */

type BranchScreensPanelProps = {
  selectedId: IdLike | null;
  selectedBranch: BranchLike | null;
  selectedBranchScreens: ScreenLike[];
  isLoadingScreens: boolean;
  isErrorScreens: boolean;
};

const BranchScreensPanel = React.memo(function BranchScreensPanel({
  selectedId,
  selectedBranch,
  selectedBranchScreens,
  isLoadingScreens,
  isErrorScreens,
}: BranchScreensPanelProps) {
  // Split into single vs grouped screens
  const singleScreens = useMemo(
    () => selectedBranchScreens.filter((s) => !s.group),
    [selectedBranchScreens]
  );

  const groupedScreens = useMemo(
    () => selectedBranchScreens.filter((s) => s.group),
    [selectedBranchScreens]
  );

  if (!selectedId) return null;

  return (
    <section className="mt-6 w-full rounded-xl bg-white p-3 sm:p-4 lg:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="max-w-full truncate text-base font-semibold text-neutral-900 sm:text-lg lg:text-2xl">
          {selectedBranch?.name
            ? `Screens in ${selectedBranch.name} Branch`
            : `#${selectedId}`}
        </h2>
        {!isLoadingScreens && !isErrorScreens && (
          <span className="text-xs text-neutral-500 sm:text-sm">
            {selectedBranchScreens.length} screens
          </span>
        )}
      </div>

      {isLoadingScreens && (
        <p className="text-xs text-neutral-500 sm:text-sm">
          Loading screens…
        </p>
      )}

      {isErrorScreens && !isLoadingScreens && (
        <p className="text-xs text-red-600 sm:text-sm">
          Failed to load screens for this branch.
        </p>
      )}

      {!isLoadingScreens && !isErrorScreens && (
        <>
          {/* Row 1: Single Screens */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Monitor size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-500 sm:text-xs">
                  Single Screens
                </p>
              </div>
            </div>

            {singleScreens.length === 0 ? (
              <p className="rounded-md bg-white px-3 py-2 text-[11px] text-neutral-400 sm:text-xs">
                No single screens in this branch.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {singleScreens.map((s) => {
                  const playlist =
                    s.PlaylistName || s.playlistName || "No playlist";

                  return (
                    <div
                      key={s.id}
                      className="flex h-full flex-col justify-between rounded-lg border border-neutral-100 bg-white p-3 text-xs shadow-md sm:text-sm"
                    >
                      {/* Header row: icon + name + id */}
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <Monitor size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-full truncate text-xs font-semibold text-neutral-900 sm:text-sm">
                            {s.name || s.screenName || "Unnamed screen"}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Screen ID:{" "}
                            <span className="break-all">{s.screenId}</span>
                          </p>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-600 sm:text-xs">
                        <div className="flex min-w-[120px] items-center gap-1">
                          <span className="font-medium text-neutral-800">
                            Playlist:
                          </span>
                          <span className="max-w-[140px] truncate align-middle">
                            {playlist}
                          </span>
                        </div>

                        <div className="flex min-w-[80px] items-center gap-1">
                          <span className="font-medium text-neutral-800">
                            Ratio:
                          </span>
                          <span>{s.ratio || "—"}</span>
                        </div>
                      </div>

                      {/* Status row */}
                      <div className="mt-2 flex justify-end">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                            s.isOnline
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              s.isOnline ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {s.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 2: Grouped Screens */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-500 sm:text-xs">
                  Screens organised in groups.
                </p>
              </div>
            </div>

            {groupedScreens.length === 0 ? (
              <p className="rounded-md bg-white px-3 py-2 text-[11px] text-neutral-400 sm:text-xs">
                No grouped screens in this branch.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {groupedScreens.map((s) => {
                  const playlist =
                    s.PlaylistName || s.playlistName || "No playlist";

                  return (
                    <div
                      key={s.id}
                      className="flex h-full flex-col justify-between rounded-lg border border-neutral-100 bg-white p-3 text-xs shadow-md sm:text-sm"
                    >
                      {/* Header row: icon + name + group */}
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <Users size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-full truncate text-xs font-semibold text-neutral-900 sm:text-sm">
                            {s.name || s.screenName || "Unnamed screen"}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Group: {s.group || s.groupName || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-600 sm:text-xs">
                        <div className="flex min-w-[120px] items-center gap-1">
                          <span className="font-medium text-neutral-800">
                            Playlist:
                          </span>
                          <span className="max-w-[140px] truncate align-middle">
                            {playlist}
                          </span>
                        </div>

                        <div className="flex min-w-[80px] items-center gap-1">
                          <span className="font-medium text-neutral-800">
                            Ratio:
                          </span>
                          <span>{s.ratio || "—"}</span>
                        </div>
                      </div>

                      {/* Status row */}
                      <div className="mt-2 flex justify-end">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                            s.isOnline
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              s.isOnline ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {s.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
});

/* --------------------------- Main Card --------------------------- */

const BranchCard: React.FC = () => {
  const { data: branches = [], isLoading, isError } = useGetBranches();
  const [page, setPage] = useState(0);

  // local selected branch id (NOT Redux)
  const [selectedId, setSelectedId] = useState<IdLike | null>(null);

  // inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mutate: deleteBranch, isPending: isDeleting } = useDeleteBranch();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const [uiError, setUiError] = useState<unknown | null>(null);
  const [successToast, setSuccessToast] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const { mutate: renameBranch, isPending: isRenaming } = useRenameBranch();

  const total = branches.length;
  const hasPaging = total > PAGE_SIZE;
  const totalPages = hasPaging ? Math.ceil(total / PAGE_SIZE) : 1;

  const visibleBranches = useMemo(() => {
    if (!hasPaging) return branches;
    const start = page * PAGE_SIZE;
    return branches.slice(start, start + PAGE_SIZE);
  }, [branches, page, hasPaging]);

  const visibleCount = visibleBranches.length;

  const lgColsClass =
    visibleCount >= 4
      ? "lg:grid-cols-4"
      : visibleCount === 3
      ? "lg:grid-cols-3"
      : visibleCount === 2
      ? "lg:grid-cols-2"
      : "lg:grid-cols-1";

  const canPrev = hasPaging && page > 0;
  const canNext = hasPaging && page < totalPages - 1;

  const handlePrev = () => {
    if (!canPrev) return;
    setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    setPage((p) => p + 1);
  };

  const startEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = (id: number) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    renameBranch(
      { id: String(id), name: trimmed },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingName("");
          setSuccessToast({
            title: "Branch renamed",
            message: "The branch name has been updated successfully.",
          });
        },
        onError: (err) => {
          setUiError(err);
        },
      }
    );
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BRANCHES_QK }),
        queryClient.invalidateQueries({
          queryKey: BRANCHSCREEN_QK(selectedId),
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch screens for the selected branch
  const {
    data: selectedBranchScreens = [],
    isLoading: isLoadingScreens,
    isError: isErrorScreens,
  } = useGetBranchScreen(selectedId);

  const selectedBranch = useMemo(
    () => branches.find((b: any) => b.id === selectedId) || null,
    [branches, selectedId]
  );

  return (
    <section className="w-full max-w-full overflow-x-hidden rounded-xl bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: title + description */}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-neutral-900 sm:text-lg lg:text-2xl">
            Branches
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm lg:text-base">
            Manage your branches and their screens.
          </p>
        </div>

        {/* Right: stats + action */}
        <div className="flex items-center gap-3 sm:justify-end">
          {!isLoading && !isError && (
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 sm:text-sm lg:text-base">
              <span className="truncate">{branches.length} branches</span>
              {hasPaging && (
                <span className="shrink-0 text-[10px] text-neutral-400 sm:text-xs lg:text-sm">
                  Page {page + 1} / {totalPages}
                </span>
              )}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold 
                 text-white shadow-sm transition hover:scale-[1.03] hover:bg-red-600 
                 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
          >
            <Plus className="h-4 w-4" />
            <span>New Branch</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div
          className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${lgColsClass} xl:grid-cols-4`}
        >
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm lg:p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-neutral-200" />
                  <div className="h-3 w-20 rounded bg-neutral-200" />
                </div>
              </div>
              <div className="mb-3 h-3 w-32 rounded bg-neutral-200" />
              <div className="h-9 w-full rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 lg:text-base">
          Failed to load branches.
        </div>
      )}

      {/* Grid of branch cards */}
      {!isLoading && !isError && total > 0 && (
        <>
          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${lgColsClass} xl:grid-cols-4`}
          >
            {visibleBranches.map((b: any) => {
              const isEditing = editingId === b.id;
              const isSelected = selectedId === b.id;

              // only the branch being edited gets the actual editingName;
              // others get a stable empty string so React.memo won't re-render them
              const editingNameForBranch = isEditing ? editingName : "";

              return (
                <BranchItemCard
                  key={b.id}
                  branch={b}
                  isSelected={isSelected}
                  onSelect={() => setSelectedId(b.id as IdLike)}
                  isEditing={isEditing}
                  editingName={editingNameForBranch}
                  onChangeEditingName={setEditingName}
                  onStartEdit={() => startEdit(b.id, b.name)}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={() => saveEdit(b.id)}
                  isRenaming={isRenaming}
                  onDelete={() => {
                    if (
                      !confirm(
                        `Delete branch "${b.name}"?\n\nNote: All devices/screens under this branch and their schedules will also be deleted.`
                      )
                    )
                      return;

                    setDeletingId(b.id);
                    deleteBranch(
                      { id: String(b.id) },
                      {
                        onSuccess: () => {
                          setDeletingId(null);
                          setSuccessToast({
                            title: "Branch deleted",
                            message:
                              "The branch has been deleted successfully.",
                          });
                        },
                        onError: (err) => {
                          setDeletingId(null);
                          setUiError(err);
                        },
                      }
                    );
                  }}
                  isDeleting={isDeleting && deletingId === b.id}
                />
              );
            })}
          </div>

          {/* Prev / Next controls — only when > 4 */}
          {hasPaging && (
            <div className="mt-5 flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:text-sm lg:text-base"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:text-sm lg:text-base"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && total === 0 && (
        <p className="text-sm text-neutral-500 lg:text-base">
          No branches found.
        </p>
      )}

      {/* Screens of selected branch */}
      <BranchScreensPanel
        selectedId={selectedId}
        selectedBranch={selectedBranch}
        selectedBranchScreens={selectedBranchScreens}
        isLoadingScreens={isLoadingScreens}
        isErrorScreens={isErrorScreens}
      />

      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {!!uiError && (
        <ErrorToast
          error={uiError}
          onClose={() => setUiError(null)}
          anchor="top-right"
        />
      )}

      {successToast && (
        <SuccessToast
          title={successToast.title}
          message={successToast.message}
          onClose={() => setSuccessToast(null)}
          anchor="top-right"
        />
      )}
    </section>
  );
};

export default BranchCard;
