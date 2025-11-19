// sections/SingleScreensSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Monitor,
  Pencil,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import AddScreenModal from "../../Components/Models/AddScreenModal";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";
import { setScreens } from "../../Redux/ScreenManagement/ScreenSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedBranchId,
  setSelectedRatio,
  setDefaultPlaylist,
} from "../../Redux/ScreenManagement/ScreenManagementSlice";
import { resetScreenForm } from "../../Redux/AddScreen/AddScreenSlice";
import type { RootState } from "../../../store";
import { useDeleteScreen } from "@/Redux/ScreenManagement/DeleteScreen";
const CHUNK = 10;
const MIN_VISIBLE = CHUNK;

const SingleScreensSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingScreen, setEditingScreen] = useState<any | null>(null);
  const [visible, setVisible] = useState(CHUNK);
  const dispatch = useDispatch();
  const { data: screens, isLoading, isError, error, refetch } = useGetScreen();
  const { mutate: deleteScreen } = useDeleteScreen();
  console.log(screens);
  const FilteredBranchId = useSelector(
    (s: RootState) => s.screenManagement.FilterScreenAcctoBranchId
  );

  // Fill Redux with screens
  useEffect(() => {
    if (!isLoading && !isError && Array.isArray(screens)) {
      dispatch(setScreens(screens as any));
    }
  }, [screens, isLoading, isError, dispatch]);
  const totalScreens = screens ?? [];
  const filteredScreens = useMemo(() => {
    if (!Array.isArray(totalScreens)) return [];

    // if FilteredBranchId is empty / null => show all
    if (!FilteredBranchId) return totalScreens;

    const branchIdNum = Number(FilteredBranchId);
    if (!Number.isFinite(branchIdNum)) return totalScreens;

    return totalScreens.filter((sc) => Number(sc.branchId) === branchIdNum);
  }, [totalScreens, FilteredBranchId]);

  const total = filteredScreens.length;

  useEffect(() => {
    if (total === 0) setVisible(CHUNK);
    else setVisible((v) => Math.min(Math.max(MIN_VISIBLE, v), total));
  }, [total]);

  const visibleScreens = useMemo(() => {
    if (!filteredScreens || filteredScreens.length === 0) return [];
    return filteredScreens.slice(0, visible);
  }, [filteredScreens, visible]);
  const canShowMore = visible < total;
  const canShowLess = visible > MIN_VISIBLE;

  const onShowMore = () => setVisible((v) => Math.min(total, v + CHUNK));
  const onShowLess = () => setVisible((v) => Math.max(MIN_VISIBLE, v - CHUNK));

  return (
    <>
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm max-w-full overflow-x-hidden">
        <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-2">
            <Monitor size={18} className="text-neutral-600 shrink-0" />
            <h2 className="truncate text-base font-semibold text-neutral-800">
              Single Screens
            </h2>
            {!isLoading && !isError ? (
              <span className="ml-2 shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {total}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingScreen(null);
                setOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              <Plus size={16} /> Add Screen
            </button>
          </div>
        </header>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="flex w-full items-start gap-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
                  <div className="flex-1">
                    <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
                    <div className="mt-2 h-3 w-64 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded bg-neutral-200" />
                  <div className="h-6 w-6 animate-pulse rounded bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <div className="font-semibold">Failed to load screens.</div>
            {error?.message ? (
              <div className="mt-1">{error.message}</div>
            ) : null}
            <button
              onClick={() => refetch()}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* List / Empty state */}
        {!isLoading && !isError && (
          <>
            {total === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
                <div className="mx-auto mb-2 w-fit rounded-full bg-neutral-100 p-2">
                  <Monitor size={18} className="text-neutral-600" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  No screens yet
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Add your first screen to see it here.
                </p>
                <button
                  onClick={() => setOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
                >
                  <Plus size={16} /> Add Screen
                </button>
              </div>
            ) : (
              <>
                {/* FIXED HEIGHT SCROLL AREA */}
                <div className="h-[55vh] sm:h-[65vh] lg:h-[70vh] overflow-y-auto overscroll-contain pr-1 scrollbar-hide">
                  <div className="flex flex-col gap-3">
                    {visibleScreens.map((sc) => (
                      <article
                        key={sc.id}
                        className="flex flex-col items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center"
                      >
                        <div className="flex w-full items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <Monitor
                              size={18}
                              className={
                                sc.active
                                  ? "text-green-600"
                                  : "text-neutral-400"
                              }
                              aria-label={sc.active ? "Online" : "Offline"}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-neutral-900">
                              {sc.name || "Unnamed screen"}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                              ID:{sc.id}
                              <span className="mx-2">•</span>
                              {sc.ratio ?? "—"}
                              <span className="mx-2">•</span>
                              {sc.branch ?? "No branch"}
                              <span className="mx-2">•</span>
                              🎵 {sc.PlaylistName ? sc.PlaylistName : ""}
                              {(() => {
                                const ls = sc.lastSeen ?? "—";
                                return (
                                  <>
                                    <span className="mx-2">•</span>
                                    {ls}
                                  </>
                                );
                              })()}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3 self-end text-neutral-500 sm:self-auto">
                          <button
                            className="rounded p-1 hover:bg-neutral-100"
                            title="Edit"
                            aria-label={`Edit ${sc.name || "screen"}`}
                            onClick={() => {
                              dispatch(resetScreenForm());
                              setIsEditMode(true);
                              setEditingScreen(sc);

                              // ✅ pre-select branch
                              if (sc.branchId != null) {
                                dispatch(setSelectedBranchId(sc.branchId));
                              }

                              // ✅ pre-select ratio
                              if (sc.ratioId != null) {
                                dispatch(
                                  setSelectedRatio({
                                    id: sc.ratioId,
                                    name: sc.ratio ?? null,
                                  })
                                );
                              }

                              // ✅ pre-select playlist
                              if (sc.PlaylistId != null) {
                                // DefaultPlaylistDropdown reads screenManagement.playlist_id
                                dispatch(
                                  setDefaultPlaylist(String(sc.PlaylistId))
                                );
                              }

                              setOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this screen?")) {
                                deleteScreen({ screenId: String(sc.screenId) });
                              }
                            }}
                            className="rounded p-1 hover:bg-neutral-100 text-red-500"
                            title="Delete"
                            aria-label={`Delete ${sc.name || "screen"}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {/* Controls (outside the scroll area) */}
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
          </>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-3xl lg:max-w-4xl">
            <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
              <AddScreenModal
                isEdit={isEditMode}
                editingScreen={editingScreen}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleScreensSection;
