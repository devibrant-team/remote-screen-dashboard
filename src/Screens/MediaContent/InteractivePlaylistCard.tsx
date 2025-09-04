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

const FALLBACK_IMG =
  "https://dummyimage.com/640x360/eeeeee/9aa0a6&text=No+Preview";

// ✅ Inline typed hooks (no separate file needed)
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

export default function InteractivePlaylist() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, error } = useGetInteractiveplaylist();
  const playlists: PlaylistItem[] = (data as PlaylistItem[]) ?? [];

  // ⬇️ Local open/close for the editor modal (rendered below)
  const [editorOpen, setEditorOpen] = useState(false);

  const openEditor = async (id: number) => {
    // 1) set which playlist we’re editing
    dispatch(setSelectedId(id));
    // 2) show editor immediately
    dispatch(setIsEditing(true));
    setEditorOpen(true);
    // 3) hydrate with details (optional to await)
    try {
      // If it's a createAsyncThunk, you can use .unwrap(); here we keep it generic.
      await dispatch(fetchInteractiveDetails(id) as any);
    } catch (e) {
      console.error("Failed to fetch details:", e);
      // you can keep modal open and show an inline error/toast if you want
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

        {/* Still mount editor so you can open it from elsewhere if needed */}
        {editorOpen && <CreateInteractivePlaylist onCloseAll={closeEditor} />}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {playlists.slice(0, 3).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openEditor(p.id)}
            className="text-left bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <img
              src={p.media || FALLBACK_IMG}
              alt={p.name || `Playlist #${p.id}`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
              className="w-full h-48 object-cover"
              loading="lazy"
              draggable={false}
            />
            <div className="p-4 space-y-2 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-black truncate">
                {p.name || `Playlist #${p.id}`}
              </h3>
              <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                <span>Slides:</span>
                <span>{p.slideNumber ?? p.slide_number ?? "—"}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                <span>Duration:</span>
                <span>{formatSeconds(p.duration)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ⬇️ Render the editor modal from THIS component; control with local state */}
      {editorOpen && <CreateInteractivePlaylist onCloseAll={closeEditor} />}
    </>
  );
}
