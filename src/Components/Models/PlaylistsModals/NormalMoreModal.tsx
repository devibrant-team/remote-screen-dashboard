import { useEffect } from "react";
import BaseModal from "../BaseModal";
import { useGetNormalPlaylist } from "../../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { useDispatch } from "react-redux";
import { loadPlaylistForEdit } from "../../../Redux/Playlist/EditPlaylist/EditNormalPlaylistSlice";
import { useNavigate } from "react-router-dom";
import { setIsEdit, setPlaylistName } from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { AppDispatch } from "../../../../store";

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

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // When modal opens, ensure first page is present (useful if it was closed before first load)
  useEffect(() => {
    if (open && !data.length && !isLoading) refetch();
  }, [open, data.length, isLoading, refetch]);

  if (!open) return null;

  return (
    <div
      className="
        [&_.fixed>div]:max-w-none
        [&_.fixed>div]:w-[95vw]
        sm:[&_.fixed>div]:w-[85vw]
        lg:[&_.fixed>div]:w-1/2
      "
    >
      <BaseModal open={open} onClose={onClose} title="All Normal Playlists">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
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
        ) : !data.length ? (
          <div className="p-6 text-center rounded-xl border border-gray-200 bg-white">
            <p className="text-gray-700">No playlists found.</p>
          </div>
        ) : (
          <div className="relative max-h-[70vh] overflow-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    dispatch(loadPlaylistForEdit(p.id));
                    navigate(`/playlist`);
                    dispatch(setIsEdit(true));
                    dispatch(setPlaylistName(p.name));
                  }}
                  className="bg-[var(--white)] cursor-pointer border border-gray-200 rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col"
                >
                  <img
                    src={p.media}
                    alt={p.name || `Playlist #${p.id}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                    className="w-full h-48 object-fill"
                    loading="lazy"
                    draggable={false}
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
                </button>
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
                  <span className="text-xs text-gray-500">You’ve reached the end</span>
                )}
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}
