import { useDispatch } from "react-redux";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import type { AppDispatch } from "../../../store";
import { useNavigate } from "react-router-dom";
import { loadPlaylistForEdit } from "../../Redux/Playlist/EditPlaylist/EditNormalPlaylistSlice";
import {
  setIsEdit,
  setPlaylistName,
} from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { useDeleteNormalPlaylist } from "../../ReactQuery/GetPlaylists/DeletePlaylist";
import { X } from "lucide-react";
import MediaPreview from "../../Components/Media/MediaPreview";
import { useConfirmDialog } from "@/Components/ConfirmDialogContext";

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

export default function NormalPlaylistCard() {
  const { data, isLoading, isError, error } = useGetNormalPlaylist();
  const playlists = data?.items ?? [];

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const items = playlists.slice(0, 4);
  const { deletePlaylist, deletingId } = useDeleteNormalPlaylist();
  const confirm = useConfirmDialog();
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

  if (!items.length) {
    return (
      <div className="p-6 text-center rounded-xl border border-gray-200 bg-white">
        <p className="text-gray-700">No playlists found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4 xl:grid-cols-4">
      {items.map((p) => (
        <div
          key={p.id}
          onClick={() => {
            dispatch(loadPlaylistForEdit(p.id));
            navigate(`/playlist`);
            dispatch(setIsEdit(true));
            dispatch(setPlaylistName(p.name));
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dispatch(loadPlaylistForEdit(p.id));
              navigate(`/playlist`);
              dispatch(setIsEdit(true));
              dispatch(setPlaylistName(p.name));
            }
          }}
          className={`
          group relative overflow-hidden rounded-2xl border border-gray-200 bg-white text-left
          shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mainred)]
        `}
        >
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation(); // ⬅ prevent card click

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
           text-gray-600 hover:bg-white hover:text-red-600 border border-gray-200 z-3 shadow-sm"
          >
            {deletingId === p.id ? (
              <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
            ) : (
              <X size={16} />
            )}
          </button>

          {/* Media */}
          <div className="relative aspect-[16/9] w-full overflow-hidden ">
            <MediaPreview
              src={p.media}
              type={guessTypeFromUrl(p.media)}
              alt={p.name || `Playlist #${p.id}`}
              className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />

            <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-black/5">
                {p.slideNumber ?? "—"} Slides
              </span>
              <span className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                {formatSeconds(p.duration)}
              </span>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Body */}
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {p.name || `Playlist #${p.id}`}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                Normal playlist • {p.slideNumber ?? "—"} slides
              </p>
            </div>

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
      ))}
    </div>
  );
}
