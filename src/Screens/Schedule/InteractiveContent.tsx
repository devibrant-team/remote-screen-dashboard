// src/Screens/MediaContent/InteractivePlaylistCard.tsx
import { useEffect } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { useGetInteractiveplaylist } from "../../ReactQuery/GetPlaylists/GetInteractivePlaylist";

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

export default function InteractivePlaylist() {
  const { data, isLoading, isError, error } = useGetInteractiveplaylist();
  const playlists = data ?? [];

  // Init FullCalendar Draggable AFTER list mounts/changes
  useEffect(() => {
    const el = document.getElementById("interactive-playlist-list");
    if (!el) return;

    const draggable = new Draggable(el, {
      itemSelector: "li[data-playlist-id]",
      eventData: (liEl) => {
        const title = liEl.getAttribute("data-title") || "Interactive Playlist";
        const pid = liEl.getAttribute("data-playlist-id") || "";
        const durationSec = Number(liEl.getAttribute("data-duration") || 0);
        return {
          title,
          // FC will size the temp event; Calender.eventReceive will read durationSec
          duration: { seconds: durationSec },
          extendedProps: { playlistId: pid, durationSec },
        };
      },
    });

    return () => draggable.destroy();
  }, [playlists.length]);

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
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
    <ul id="interactive-playlist-list" className="flex flex-col gap-2">
      {playlists.map((p) => (
        <li
          key={p.id}
          data-playlist-id={p.id}
          data-title={p.name || `Interactive #${p.id}`}
          data-duration={Number(p.duration || 0)}  // seconds
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
              <span className="font-mono tabular-nums">{formatSeconds(p.duration)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
