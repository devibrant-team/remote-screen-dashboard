import { useGetInteractiveplaylist } from "../../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import BaseModal from "../BaseModal";

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
  // manual "Load more" – uses infinite hook
  const {
    data: items,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetInteractiveplaylist();

  if (!open) return null;

  return (
    // Resize BaseModal panel responsively: 95vw (xs), 85vw (sm), 1/2 width (lg+)
    <div
      className="
        [&_.fixed>div]:max-w-none
        [&_.fixed>div]:w-[95vw]
        sm:[&_.fixed>div]:w-[85vw]
        lg:[&_.fixed>div]:w-1/2
      "
    >
      <BaseModal open={open} onClose={onClose} title="All Interactive Playlists">
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
          <div className="relative max-h-[70vh] overflow-auto pr-1">
            {/* 1 / 2 / 3 per row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="bg-[var(--white)] border border-gray-200 rounded-lg shadow hover:shadow-md transition overflow-hidden"
                >
                  <img
                    src={p.media || FALLBACK_IMG}
                    alt={p.name || `Playlist #${p.id}`}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
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
                      <span>{(p as any).slideNumber ?? (p as any).slide_number ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs text-gray-700">
                      <span>Duration:</span>
                      <span>{formatSeconds((p as any).duration)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky footer with MANUAL load more */}
            <div className="sticky bottom-0 left-0 right-0 mt-3 bg-[var(--white)]/95 backdrop-blur px-3 py-2">
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
      </BaseModal>
    </div>
  );
}
