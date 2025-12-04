// src/Screens/MediaContent/InteractivePlaylistCard.tsx
import { useGetInteractiveplaylist } from "../../../ReactQuery/GetPlaylists/GetInteractivePlaylist";

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

export default function InteractiveContent() {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useGetInteractiveplaylist();

  const playlists = data?.items ?? [];
  const currentPage = data?.currentPage ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? playlists.length;
  const perPage = data?.perPage ?? playlists.length;

  const start = totalItems ? (currentPage - 1) * perPage + 1 : 0;
  const end = totalItems ? Math.min(start + perPage - 1, totalItems) : 0;

  if (isLoading) {
    const skeletonCount = perPage || 5;
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg bg-white p-2"
          >
            <div className="h-10 w-16 rounded-md bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 rounded bg-neutral-200 animate-pulse" />
              <div className="h-3 w-24 rounded bg-neutral-200 animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        Failed to load interactive playlists
        {error && (
          <>
            : <span className="font-medium">{(error as any)?.message}</span>
          </>
        )}
      </div>
    );
  }

  if (!playlists.length) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-700">
        No interactive playlists found.
      </div>
    );
  }

  return (
    <>
      <ul
        id="interactive-playlist-list"
        className="flex flex-col gap-2"
      >
        {playlists.map((p) => (
          <li
            key={p.id}
            data-playlist-id={p.id}
            data-title={p.name || `Interactive #${p.id}`}
            data-duration={Number(p.duration || 0)}
            className="fc-draggable group relative flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2 hover:border-red-500 hover:shadow-sm transition cursor-grab"
            title={p.name || `Interactive #${p.id}`}
          >
            <img
              src={p.media}
              alt={p.name || `Interactive #${p.id}`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
              className="h-10 w-16 rounded-md object-cover ring-1 ring-neutral-200 select-none"
              loading="lazy"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">
                {p.name || `Interactive #${p.id}`}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-600">
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 ring-1 ring-neutral-200">
                  Slides: {p.slideNumber ?? "—"}
                </span>
                <span className="font-mono tabular-nums">
                  {formatSeconds(p.duration)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pager using backend pagination */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-700">
        <span className="font-medium">
          {start}-{end} of {totalItems}
        </span>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => fetchPreviousPage()}
            disabled={!hasPreviousPage || isFetchingPreviousPage}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-neutral-50"
          >
            Prev
          </button>
          <span className="tabular-nums">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
