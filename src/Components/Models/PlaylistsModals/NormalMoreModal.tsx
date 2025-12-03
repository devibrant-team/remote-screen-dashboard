import { useEffect } from "react";
import { useGetNormalPlaylist } from "../../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { useDispatch } from "react-redux";
import { loadPlaylistForEdit } from "../../../Redux/Playlist/EditPlaylist/EditNormalPlaylistSlice";
import { useNavigate } from "react-router-dom";
import {
  setIsEdit,
  setPlaylistName,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { AppDispatch } from "../../../../store";
import { useDeleteNormalPlaylist } from "../../../ReactQuery/GetPlaylists/DeletePlaylist";
import { X } from "lucide-react";
import { useConfirmDialog } from "@/Components/ConfirmDialogContext";
import MediaPreview from "@/Components/Media/MediaPreview";

function formatSeconds(total?: number) {
  const s = Number(total || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}
function guessTypeFromUrl(url: string): "video" | "image" {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  return "image";
}

type Props = { open: boolean; onClose: () => void };

export default function NormalMoreModal({ open, onClose }: Props) {
  const {
    data = [],
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetNormalPlaylist();
  const { deletePlaylist, deletingId } = useDeleteNormalPlaylist();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  formatSeconds;
  // When modal opens, ensure first page is present (useful if it was closed before first load)
  useEffect(() => {
    if (open && !data.length && !isLoading) refetch();
  }, [open, data.length, isLoading, refetch]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
      onClick={onClose} // click outside to close
    >
      <div
        className="
        relative w-[95vw] sm:w-[85vw] lg:w-1/2 max-h-[90vh]
        rounded-2xl bg-white shadow-xl flex flex-col
      "
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            All Normal Playlists
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 overflow-hidden shadow"
                >
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
              Failed to load playlists
              {error && `: ${(error as any)?.message ?? ""}`}
            </div>
          ) : !data.length ? (
            <div className="p-6 text-center rounded-xl border border-gray-200 bg-white">
              <p className="text-gray-700">No playlists found.</p>
            </div>
          ) : (
            <div className="relative max-h-[70vh] overflow-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      dispatch(loadPlaylistForEdit(p.id));
                      navigate(`/playlist`);
                      dispatch(setIsEdit(true));
                      dispatch(setPlaylistName(p.name));
                    }}
                    className="relative bg-[var(--white)] cursor-pointer border border-gray-200 rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col"
                    role="button"
                    tabIndex={0}
                  >
                    {/* Delete button (shown on each card) */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation(); // prevent opening editor

                        const ok = await confirm({
                          title: "Delete playlist",
                          message: `Are you sure you want to delete "${
                            p.name || `Playlist #${p.id}`
                          }"? This cannot be undone.`,
                          confirmText: "Delete",
                          cancelText: "Cancel",
                        });

                        if (!ok) return;
                        deletePlaylist(p.id);
                      }}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90
               text-gray-600 hover:bg-white hover:text-red-600 border border-gray-200 shadow-sm"
                      aria-label={`Delete ${p.name || "playlist"}`}
                    >
                      {deletingId === p.id ? (
                        <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>

                    <MediaPreview
                      src={p.media}
                      type={guessTypeFromUrl(p.media)}
                      alt={p.name || `Playlist #${p.id}`}
                      className="w-full h-48 object-fill"
                    />

                    <div className="p-4 space-y-2 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-[var(--black)] truncate">
                        {p.name || `Playlist #${p.id}`}
                      </h3>
                      <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                        <span>Slides:</span>
                        <span>{p.slideNumber ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                        <span>Duration:</span>
                        <span>{formatSeconds(p.duration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sticky footer with infinite load */}
              <div className="sticky bottom-0 left-0 right-0 mt-3 bg-[var(--white)]/95 backdrop-blur px-3 py-2">
                <div className="grid place-items-center">
                  {hasNextPage ? (
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="bg-[var(--mainred)] text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
                    >
                      {isFetchingNextPage ? "Loading..." : "See more"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">
                      You’ve reached the end
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
