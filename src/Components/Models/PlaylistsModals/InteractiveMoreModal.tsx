import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../store";
import {
  setSelectedId,
  fetchInteractiveDetails,
  setIsEditing,
} from "../../../Redux/Playlist/interactivePlaylist/interactiveSlice";
import { useGetInteractiveplaylist } from "../../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import CreateInteractivePlaylist from "../../InteractivePlaylist/InteractivePlaylist/InteractivePlaylist";

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
    data: items,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetInteractiveplaylist();

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
              ) : !items?.length ? (
                <div className="p-6 text-center rounded-xl border border-gray-200 bg-white">
                  <p className="text-gray-700">No playlists found.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* ⬇️ Hide scrollbar here */}
                  <div className="max-h-[60vh] overflow-auto pr-1 scrollbar-hide">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => openEditor(p.id)}
                          className="text-left bg-[var(--white)] border border-gray-200 rounded-lg shadow hover:shadow-md transition overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <img
                            src={p.media || FALLBACK_IMG}
                            alt={p.name || `Playlist #${p.id}`}
                            onError={(e) =>
                              ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)
                            }
                            className="w-full h-24 object-contain"
                            loading="lazy"
                            draggable={false}
                          />
                          <div className="p-2 space-y-1">
                            <h3 className="text-sm font-semibold text-[var(--black)] truncate">
                              {p.name || `Playlist #${p.id}`}
                            </h3>
                            <div className="flex justify-between text-[10px] sm:text-xs text-gray-700">
                              <span>Slides:</span>
                              <span>{p.slideNumber ?? p.slide_number ?? "—"}</span>
                            </div>
                            <div className="flex justify-between text-[10px] sm:text-xs text-gray-700">
                              <span>Duration:</span>
                              <span>{formatSeconds(p.duration)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sticky footer */}
                  <div className="sticky bottom-0 left-0 right-0 mt-3 bg-[var(--white)]/95 backdrop-blur px-3 py-2 border-t border-gray-200">
                    <div className="grid place-items-center">
                      {hasNextPage ? (
                        <button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          className="bg-[var(--mainred)] text-white px-3 py-1.5 rounded-md text-sm font-semibold disabled:opacity-60 transition"
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

      {/* Editor (z-50 in its own component). Renders only when editorOpen is true */}
      {editorOpen && <CreateInteractivePlaylist onCloseAll={closeEditor} />}
    </div>
  );
}
