// src/components/Playlist/Interactive/InteractiveMoreModal.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../store";
import {
  setSelectedId,
  fetchInteractiveDetails,
  setIsEditing,
} from "../../../Redux/Playlist/interactivePlaylist/interactiveSlice";
import { useGetInteractiveplaylist } from "../../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import { useDeleteNormalPlaylist } from "../../../ReactQuery/GetPlaylists/DeletePlaylist";
import CreateInteractivePlaylist from "../../InteractivePlaylist/InteractivePlaylist/InteractivePlaylist";
import { X } from "lucide-react";

const FALLBACK_IMG =
  "https://dummyimage.com/640x360/eeeeee/9aa0a6&text=No+Preview";

function formatSeconds(total?: number) {
  const s = Number(total || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

type Props = { open: boolean; onClose: () => void };

export default function InteractiveMoreModal({ open, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [editorOpen, setEditorOpen] = useState(false);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetInteractiveplaylist();

  const { deletePlaylist, deletingId } = useDeleteNormalPlaylist();

  // Make sure we have data when the modal opens
  useEffect(() => {
    if (open && !items.length && !isLoading) refetch();
  }, [open, items.length, isLoading, refetch]);

  if (!open && !editorOpen) return null;

  const openEditor = async (id: number) => {
    dispatch(setSelectedId(id));
    dispatch(setIsEditing(true));
    setEditorOpen(true);
    try {
      await dispatch(fetchInteractiveDetails(id) as any);
    } catch (e) {
      console.error("Failed to fetch interactive details:", e);
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    dispatch(setIsEditing(false));
    onClose();
  };

  return (
    <div className="relative">
      {open && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="All Interactive Playlists"
            className="fixed left-1/2 top-10 z-40 -translate-x-1/2
                       w-[95vw] sm:w-[85vw] lg:w-1/2
                       bg-white rounded-xl shadow-xl border border-gray-200
                       overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--black)]">
                All Interactive Playlists
              </h2>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50"
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 overflow-hidden shadow">
                      <div className="w-full h-24 bg-gray-200 animate-pulse" />
                      <div className="p-2 space-y-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
                  Failed to load playlists{error && `: ${(error as any)?.message ?? ""}`}
                </div>
              ) : !items.length ? (
                <div className="p-6 text-center rounded-xl border border-gray-200 bg-white">
                  <p className="text-gray-700">No playlists found.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Scroll area */}
                  <div className="max-h-[60vh] overflow-auto pr-1 pb-16 scrollbar-hide">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((p: any) => {
                        const title = p.name || `Playlist #${p.id}`;
                        const slidesCount = p.slideNumber ?? p.slide_number ?? "—";
                        const src = p.media || FALLBACK_IMG;

                        return (
                          <div
                            key={p.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openEditor(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openEditor(p.id);
                              }
                            }}
                            className="
                              group relative overflow-hidden rounded-2xl border border-gray-200 bg-white text-left
                              shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mainred)]
                            "
                          >
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${title}"?`)) {
                                  deletePlaylist(p.id);
                                }
                              }}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90
                                         text-gray-600 hover:bg-white hover:text-red-600 border border-gray-200 z-10 shadow-sm"
                              aria-label={`Delete ${title}`}
                            >
                              {deletingId === p.id ? (
                                <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
                              ) : (
                                <X size={16} />
                              )}
                            </button>

                            {/* Media with badges + gradient (16:9) */}
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                              <img
                                src={src}
                                alt={title}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                                }}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                loading="lazy"
                                draggable={false}
                              />

                              {/* Badges (top-left) */}
                              <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
                                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-black/5">
                                  {slidesCount} Slides
                                </span>
                                <span className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                  {formatSeconds(p.duration)}
                                </span>
                              </div>

                              {/* Readability gradient */}
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>

                            {/* Body */}
                            <div className="flex items-start justify-between gap-3 p-4">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-gray-900">
                                  {title}
                                </h3>
                                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                  Interactive playlist • {slidesCount} slides
                                </p>
                              </div>

                              {/* Chevron */}
                              <div
                                aria-hidden
                                className="mt-0.5 grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 transition group-hover:border-gray-300 group-hover:text-gray-700"
                              >
                                <svg
                                  className="h-4 w-4 translate-x-0 transition group-hover:translate-x-0.5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L9.586 11H4a1 1 0 110-2h5.586L7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sticky footer */}
                  <div className="sticky bottom-0 left-0 right-0 mt-3 bg-[var(--white)]/95 backdrop-blur px-3 py-2 border-t border-gray-200">
                    <div className="grid place-items-center">
                      {hasNextPage ? (
                        <button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          className="bg-[var(--mainred)] text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
                        >
                          {isFetchingNextPage ? "Loading..." : "Load more"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">You’ve reached the end</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && <CreateInteractivePlaylist onCloseAll={closeEditor} />}
    </div>
  );
}
