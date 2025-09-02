import { useDispatch } from "react-redux";
import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { setSelectedId } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";

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

export default function NormalPlaylistCard() {
  const { data, isLoading, isError, error } = useGetNormalPlaylist();
  const playlists = data ?? [];
  const dispatch = useDispatch();
  const items = playlists.slice(0, 3);
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map(
          (
            _,
            i 
          ) => (
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
          )
        )}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((p) => (
        <button
          onClick={() => dispatch(setSelectedId(p.id))}
          key={p.id}
          className="bg-[var(--white)] cursor-pointer border border-gray-200 rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col :"
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
  );
}
