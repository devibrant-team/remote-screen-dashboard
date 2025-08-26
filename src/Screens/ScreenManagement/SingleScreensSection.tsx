// sections/SingleScreensSection.tsx
import React, { useEffect, useState } from "react";
import { Plus, Monitor, Pencil, Trash2, RefreshCw } from "lucide-react";
import BaseModal from "../../Components/Models/BaseModal";
import AddScreenModal from "../../Components/Models/AddScreenModal";
import { useGetScreen } from "../../ReactQuery/Screen/GetScreen";

const SingleScreensSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { data: screens, isLoading, isError, error, refetch } = useGetScreen();

  useEffect(() => {
    const handleClose = () => setOpen(false);
    window.addEventListener("close-add-screen-modal", handleClose as EventListener);
    return () => window.removeEventListener("close-add-screen-modal", handleClose as EventListener);
  }, []);

  const count = screens?.length ?? 0;

  return (
    <>
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor size={18} className="text-neutral-600" />
            <h2 className="text-base font-semibold text-neutral-800">Single Screens</h2>
            {!isLoading && !isError ? (
              <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {count}
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
                <div className="flex items-start gap-3 w-full">
                  <div className="h-5 w-5 rounded bg-neutral-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-40 rounded bg-neutral-200 animate-pulse" />
                    <div className="mt-2 h-3 w-64 rounded bg-neutral-200 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-neutral-200 animate-pulse" />
                  <div className="h-6 w-6 rounded bg-neutral-200 animate-pulse" />
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
            {error?.message ? <div className="mt-1">{error.message}</div> : null}
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
            {count === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
                <div className="mx-auto mb-2 w-fit rounded-full bg-neutral-100 p-2">
                  <Monitor size={18} className="text-neutral-600" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800">No screens yet</h3>
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
              <div className="flex flex-col gap-3">
                {screens?.map((sc) => (
                  <article
                    key={sc.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Monitor
                          size={18}
                          className={sc.active ? "text-green-600" : "text-neutral-400"}
                          aria-label={sc.active ? "Online" : "Offline"}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900">
                          {sc.name || "Unnamed screen"}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-500">
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

                    <div className="flex items-center gap-3 text-neutral-500">
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
