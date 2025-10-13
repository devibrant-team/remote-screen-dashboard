// sections/SingleScreensSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Monitor,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import BaseModal from "../../Components/Models/BaseModal";
import AddScreenModal from "../../Components/Models/AddScreenModal";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";
import { setScreens } from "../../Redux/ScreenManagement/ScreenSlice";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";

const CHUNK = 10;
const MIN_VISIBLE = CHUNK;

const SingleScreensSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(CHUNK);
  const dispatch = useDispatch();
  const { data: screens, isLoading, isError, error, refetch } = useGetScreen();

  // Fill Redux with screens
  useEffect(() => {
    if (!isLoading && !isError && Array.isArray(screens)) {
      dispatch(setScreens(screens as any));
    }
  }, [screens, isLoading, isError, dispatch]);

  // Modal close event
  useEffect(() => {
    const handleClose = () => setOpen(false);
    window.addEventListener(
      "close-add-screen-modal",
      handleClose as EventListener
    );
    return () =>
      window.removeEventListener(
        "close-add-screen-modal",
        handleClose as EventListener
      );
  }, []);

  const total = screens?.length ?? 0;

  // Keep visible count in bounds when data changes
  useEffect(() => {
    if (total === 0) setVisible(CHUNK);
    else setVisible((v) => Math.min(Math.max(MIN_VISIBLE, v), total));
  }, [total]);

  const visibleScreens = useMemo(() => {
    if (!screens || screens.length === 0) return [];
    return screens.slice(0, visible);
  }, [screens, visible]);

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
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              <Plus size={18} /> Add Screen
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
                <div className="h-[55vh] sm:h-[65vh] lg:h-[70vh] overflow-y-auto overscroll-contain pr-1">
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
                              {sc.ratio ?? "—"}
                              <span className="mx-2">•</span>
                              {sc.branch ?? "No branch"}
                              <span className="mx-2">•</span>
                              {sc.active ? "Online" : "Offline"}
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
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="rounded p-1 hover:bg-neutral-100"
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

      <BaseModal open={open} onClose={() => setOpen(false)} title="Add Screen">
        <AddScreenModal />
      </BaseModal>
    </>
  );
};

export default SingleScreensSection;
