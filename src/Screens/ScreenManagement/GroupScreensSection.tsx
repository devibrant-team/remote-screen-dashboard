// sections/GroupScreensSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Monitor,
  Inbox,
  AlertTriangle,
  ArrowDownCircle,
  GitBranch,
  FileStack,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import BaseModal from "../../Components/Models/BaseModal";
import { useGetGroups } from "../../ReactQuery/Group/GetGroup";
import { useGetGroupScreens } from "../../ReactQuery/Group/GetGroupScreen";
import AddGroupModal from "../../Components/Models/AddGroupModal";

type Group = {
  id: string | number;
  name: string;
  ratio?: string | null;
  branchName?: string | null;
  screenNumber?: number | null;
};

const CHUNK = 10;
const MIN_VISIBLE = CHUNK;

const SkeletonRow: React.FC = () => (
  <div className="animate-pulse rounded-lg border border-neutral-200 bg-white p-4 shadow-xs">
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded bg-neutral-200" />
      <div className="flex-1">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="mt-2 h-3 w-56 rounded bg-neutral-100" />
      </div>
    </div>
  </div>
);

const ErrorBlock: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center">
    <AlertTriangle className="mb-2 text-red-500" size={28} />
    <p className="text-sm text-red-600">Failed to load groups.</p>
    <button
      onClick={onRetry}
      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
    >
      <ArrowDownCircle size={16} /> Retry
    </button>
  </div>
);

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 p-8 text-center">
    <Inbox className="mb-2 text-neutral-400" size={28} />
    <p className="text-sm text-neutral-600">No groups yet.</p>
    <button
      onClick={onAdd}
      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
    >
      <Plus size={16} /> Create your first group
    </button>
  </div>
);

const GroupScreensSection: React.FC = () => {
  const [openCreate, setOpenCreate] = useState(false);

  // Which group was clicked
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [openScreensModal, setOpenScreensModal] = useState(false);

  // Show-more state
  const [visible, setVisible] = useState(CHUNK);

  const { data: groups, isLoading, isError, refetch } = useGetGroups();

  // Fetch screens for the selected group id
  const {
    data: groupScreens,
    isLoading: isScreensLoading,
    isError: isScreensError,
    refetch: refetchScreens,
  } = useGetGroupScreens(selectedGroupId);

  // Close "create" on global event
  useEffect(() => {
    const handleClose = () => setOpenCreate(false);
    window.addEventListener("close-add-screen-modal", handleClose as EventListener);
    return () =>
      window.removeEventListener("close-add-screen-modal", handleClose as EventListener);
  }, []);

  const handleOpenGroup = (id: number) => {
    setSelectedGroupId(id);
    setOpenScreensModal(true); // hook auto-fetches because enabled = !!id
  };

  const total = groups?.length ?? 0;

  // Keep visible within bounds & reset when list changes
  useEffect(() => {
    if (total === 0) setVisible(CHUNK);
    else setVisible((v) => Math.min(Math.max(MIN_VISIBLE, v), total));
  }, [total]);

  const visibleGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];
    return groups.slice(0, visible);
  }, [groups, visible]);

  const canShowMore = visible < total;
  const canShowLess = visible > MIN_VISIBLE;

  const onShowMore = () => setVisible((v) => Math.min(total, v + CHUNK));
  const onShowLess = () => setVisible((v) => Math.max(MIN_VISIBLE, v - CHUNK));

  return (
    <>
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm max-w-full overflow-x-hidden">
        <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-2">
            <FileStack size={18} className="text-neutral-600 shrink-0" />
            <h2 className="truncate text-base font-semibold text-neutral-800">
              Screen Groups
            </h2>
            {!isLoading && !isError ? (
              <span className="ml-2 shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {total}
              </span>
            ) : null}
          </div>

          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            <Plus size={18} /> Add Group
          </button>
        </header>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Error state */}
        {isError && <ErrorBlock onRetry={() => refetch()} />}

        {/* Empty state */}
        {!isLoading && !isError && total === 0 && <EmptyState onAdd={() => setOpenCreate(true)} />}

        {/* Groups list (fixed-height scroll + show more/less) */}
        {!isLoading && !isError && total > 0 && (
          <>
            <div className="h-[55vh] sm:h-[65vh] lg:h-[70vh] overflow-y-auto overscroll-contain pr-1">
              <div className="flex flex-col gap-3">
                {visibleGroups.map((g: Group) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleOpenGroup(Number(g.id))}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-xs transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    aria-label={`Open group ${g.name}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <FileStack size={18} className="text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-neutral-900">
                          {g.name || "Untitled group"}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          {/* Ratio */}
                          <span
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                              g.ratio
                                ? "bg-neutral-100 text-neutral-700"
                                : "bg-red-100 text-red-700",
                            ].join(" ")}
                            title={g.ratio ? `Ratio: ${g.ratio}` : "Ratio not assigned"}
                          >
                            {g.ratio || "Unassigned ratio"}
                          </span>

                          {/* Branch */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                            <GitBranch size={12} />
                            {g.branchName ?? "—"}
                          </span>

                          {/* Screens count */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                            <Monitor size={12} />
                            {g.screenNumber ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls (outside scroll area) */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-neutral-500">
                Showing {Math.min(visible, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                {canShowLess && (
                  <button
                    type="button"
                    onClick={onShowLess}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    aria-label="Show less"
                  >
                    <ChevronUp size={14} />
                    Show less
                  </button>
                )}
                {canShowMore && (
                  <button
                    type="button"
                    onClick={onShowMore}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    aria-label="Show more"
                  >
                    <ChevronDown size={14} />
                    Show 10 more
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Create Group Modal */}
      <BaseModal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Group">
        <AddGroupModal />
      </BaseModal>

      {/* Group Screens Modal (opens when a group is clicked) */}
      <BaseModal
        open={openScreensModal}
        onClose={() => setOpenScreensModal(false)}
        title="Group Screens"
      >
        {/* Prevent tall modal; scroll contents if many screens */}
        <div className="max-h-[70vh] overflow-y-auto">
          {isScreensLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-full animate-pulse rounded bg-neutral-200" />
              ))}
            </div>
          )}

          {isScreensError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to load screens.{" "}
              <button onClick={() => refetchScreens()} className="underline">
                Retry
              </button>
            </div>
          )}

          {!isScreensLoading && !isScreensError && (
            <>
              {(groupScreens?.length ?? 0) === 0 ? (
                <p className="text-sm text-neutral-600">No screens in this group.</p>
              ) : (
                <ul className="space-y-2">
                  {groupScreens!.map((sc) => (
                    <li
                      key={sc.id}
                      className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-red-500" />
                        <span className="font-medium">{sc.name}</span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {sc.branchName ?? "No branch"} • {sc.ratio ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </BaseModal>
    </>
  );
};

export default GroupScreensSection;
