// src/Screens/Schedule/Components/PlaylistPicker.tsx
import React, { useState } from "react";
import { ListVideo, Sparkles, Trash2 } from "lucide-react";
import { useGetNormalPlaylist } from "../../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { useGetInteractiveplaylist } from "../../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import MediaPreview from "../../../Components/Media/MediaPreview";

type PickerTab = "normal" | "interactive";

function formatSeconds(total?: number) {
  const s = Number(total || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

// Same helper you used in NormalContent to decide preview type
function guessTypeFromUrl(url: string): "video" | "image" {
  const ext =
    url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext) ? "video" : "image";
}

export type PlaylistPickerProps = {
  currentPlaylistId?: string;
  onPick: (opts: { playlistId: string; title?: string }) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
};

const PlaylistPicker: React.FC<PlaylistPickerProps> = ({
  currentPlaylistId,
  onPick,
  onClear,
  disabled,
  className,
}) => {
  const [tab, setTab] = useState<PickerTab>("normal");

  const {
    data: normal,
    isLoading: loadingNormal,
    isError: errorNormal,
    error: normalErr,
  } = useGetNormalPlaylist();

  const {
    data: interactive,
    isLoading: loadingInteractive,
    isError: errorInteractive,
    error: interactiveErr,
  } = useGetInteractiveplaylist();

  const list =
    tab === "normal"
      ? {
          label: "Normal",
          items: normal ?? [],
          loading: loadingNormal,
          err: errorNormal,
          e: normalErr,
          Icon: ListVideo,
        }
      : {
          label: "Interactive",
          items: interactive ?? [],
          loading: loadingInteractive,
          err: errorInteractive,
          e: interactiveErr,
          Icon: Sparkles,
        };

  return (
    <section
      className={`rounded-lg border border-gray-200 bg-white ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("normal")}
            className={
              "rounded-md border px-2 py-1 text-xs " +
              (tab === "normal"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
            }
            disabled={disabled}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setTab("interactive")}
            className={
              "rounded-md border px-2 py-1 text-xs " +
              (tab === "interactive"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
            }
            disabled={disabled}
          >
            Interactive
          </button>
          <button
            type="button"
            onClick={onClear}
            className="ml-2 inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={disabled || !currentPlaylistId}
            title="Clear assigned playlist"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      <div className="p-3">
        {list.loading ? (
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2"
              >
                <div className="h-10 w-16 rounded-md bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        ) : list.err ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            Failed to load {list.label} playlists
            {list.e ? (
              <>
                :{" "}
                <span className="font-medium">
                  {(list.e as any)?.message}
                </span>
              </>
            ) : null}
          </div>
        ) : list.items.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
            No {list.label.toLowerCase()} playlists found.
          </div>
        ) : (
          <ul className="flex max-h-60 flex-col gap-2 overflow-auto">
            {list.items.slice(0, 20).map((p: any) => (
              <li
                key={p.id}
                className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 transition hover:border-red-500 hover:shadow-sm"
                title={p.name || `Playlist #${p.id}`}
              >
                {/* Use the same preview logic as NormalContent */}
                <MediaPreview
                  src={p.media}
                  type={guessTypeFromUrl(p.media)}
                  alt={p.name || `Playlist #${p.id}`}
                  className="h-10 w-16 rounded-md object-cover ring-1 ring-gray-200 select-none"
                />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {p.name || `Playlist #${p.id}`}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-600">                   
                    <span className="font-mono tabular-nums">
                      {formatSeconds(p.duration)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onPick({ playlistId: String(p.id), title: p.name })
                  }
                  className="shrink-0 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                  disabled={disabled}
                >
                  {String(p.id) === currentPlaylistId ? "Selected" : "Assign"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default PlaylistPicker;
