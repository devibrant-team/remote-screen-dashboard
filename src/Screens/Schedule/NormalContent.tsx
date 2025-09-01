import { useEffect, useState } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";

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

export default function NormalContent() {
  const { data, isLoading, isError, error } = useGetNormalPlaylist();
  const playlists = data ?? [];

  // Pagination (5 per page)
  const pageSize = 5;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil((playlists.length || 0) / pageSize));

  // Clamp page when data size changes
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil((playlists.length || 0) / pageSize));
    if (page > newTotal - 1) setPage(newTotal - 1);
  }, [playlists.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = page * pageSize;
  const end = Math.min(start + pageSize, playlists.length);
  const pageItems = playlists.slice(start, end);

  // Init FullCalendar Draggable AFTER list renders / when page changes
  useEffect(() => {
    const el = document.getElementById("normal-playlist-list");
    if (!el) return;

    const draggable = new Draggable(el, {
      itemSelector: "li[data-playlist-id]",
      eventData: (liEl) => {
        const title = liEl.getAttribute("data-title") || "Playlist";
        const pid = liEl.getAttribute("data-playlist-id") || "";
        const durationSec = Number(liEl.getAttribute("data-duration") || 0);
        return {
          title,
          duration: { seconds: durationSec }, // temp event duration
          extendedProps: { playlistId: pid, durationSec },
        };
      },
    });

    return () => draggable.destroy();
  }, [page, pageItems.length]);

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: pageSize }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-lg bg-white p-2">
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
        Failed to load playlists
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
        No playlists found.
      </div>
    );
  }

  return (
    <>
      <ul id="normal-playlist-list" className="flex flex-col gap-2">
        {pageItems.map((p) => (
          <li
            key={p.id}
            data-playlist-id={p.id}
            data-title={p.name || `Playlist #${p.id}`}
            data-duration={Number(p.duration || 0)} // seconds
            className="fc-draggable group relative flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2 hover:border-red-500 hover:shadow-sm transition cursor-grab"
            title={p.name || `Playlist #${p.id}`}
          >
            <img
              src={p.media}
              alt={p.name || `Playlist #${p.id}`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
              className="h-10 w-16 rounded-md object-cover ring-1 ring-neutral-200 select-none"
              loading="lazy"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">
                {p.name || `Playlist #${p.id}`}
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

      {/* Pager */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-700">
        <span className="font-medium">
          {start + 1}-{end} of {playlists.length}
        </span>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-neutral-50"
          >
            Prev
          </button>
          <span className="tabular-nums">
            {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => (end >= playlists.length ? p : p + 1))}
            disabled={end >= playlists.length}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 disabled:opacity-50 hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
