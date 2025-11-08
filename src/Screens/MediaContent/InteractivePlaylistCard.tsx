// src/components/Playlist/Interactive/InteractivePlaylist.tsx
import { useState } from "react";
import { useDispatch, type TypedUseSelectorHook, useSelector } from "react-redux";
import { type AppDispatch, type RootState } from "../../../store";
import {
  setSelectedId,
  fetchInteractiveDetails,
  setIsEditing,
} from "../../Redux/Playlist/interactivePlaylist/interactiveSlice";
import { useGetInteractiveplaylist } from "../../ReactQuery/GetPlaylists/GetInteractivePlaylist";
import CreateInteractivePlaylist from "../../Components/InteractivePlaylist/InteractivePlaylist/InteractivePlaylist";

// ✅ use same delete hook used by Normal playlists
import { useDeleteNormalPlaylist } from "../../ReactQuery/GetPlaylists/DeletePlaylist";

import MediaPreview from "../../Components/Media/MediaPreview";

const FALLBACK_IMG =
  "https://dummyimage.com/640x360/eeeeee/9aa0a6&text=No+Preview";

const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

type PlaylistItem = {
  id: number;
  name?: string;
  media?: string;
  slideNumber?: number;
  slide_number?: number;
  duration?: number;
};

function formatSeconds(total?: number) {
  const s = Number(total || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

function guessTypeFromUrl(url?: string): "video" | "image" {
  const clean = (url ?? "").split(/[?#]/)[0];
  const ext = clean.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext) ? "video" : "image";
}

export default function InteractivePlaylist() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, error } = useGetInteractiveplaylist();
  const playlists: PlaylistItem[] = (data as PlaylistItem[]) ?? [];

  const [editorOpen, setEditorOpen] = useState(false);
  const selectedId = useAppSelector((s) => s.interactive.selectedId);

  // ✅ use the same delete hook (works for normal + interactive)
  const { deletePlaylist, deletingId } = useDeleteNormalPlaylist();

  const openEditor = async (id: number) => {
    dispatch(setSelectedId(id));
    dispatch(setIsEditing(true));
    setEditorOpen(true);
    try {
      await dispatch(fetchInteractiveDetails(id) as any);
    } catch (e) {
      console.error("Failed to fetch details:", e);
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    dispatch(setIsEditing(false));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 overflow-hidden shadow"
          >
            <div className="w-full h-48 bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
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
      <div className="p-6 text-center rounded-xl border border-gray-200 bg-white">
        <p className="text-gray-700">No playlists found.</p>
        {editorOpen && (
          <CreateInteractivePlaylist
            key={selectedId ?? "new"}
            onCloseAll={closeEditor}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4 xl:grid-cols-4">
        {playlists.slice(0, 4).map((p) => {
          const title = p.name || `Playlist #${p.id}`;
          const slidesCount = p.slideNumber ?? p.slide_number ?? "—";
          const type = guessTypeFromUrl(p.media);
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
              {/* ✅ Delete Button */}
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </button>

              {/* Media Preview */}
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <MediaPreview
                  src={src}
                  type={type}
                  alt={title}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
                />

                {/* Badges */}
                <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-black/5">
                    {slidesCount} Slides
                  </span>
                  <span className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    {formatSeconds(p.duration)}
                  </span>
                </div>

                {/* Gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Card Body */}
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    Interactive playlist • {slidesCount} slides
                  </p>
                </div>

                {/* Chevron Icon */}
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

      {/* ✅ Editor Modal (clean remount each time) */}
      {editorOpen && (
        <CreateInteractivePlaylist
          key={selectedId ?? "new"}
          onCloseAll={closeEditor}
        />
      )}
    </>
  );
}
