import { Play, X } from "lucide-react";
import { useVideoThumbnail } from "../../Hook/Playlist/useVideoThumbnail";
import { useDeleteMedia } from "../../ReactQuery/Media/DeleteMedia";

export const MediaCard: React.FC<{
  id: number | string; 
  url: string;
  type?: string;
  storage: number;
  onClick?: () => void;
}> = ({ id, url, type, storage, onClick }) => {
  const isVideo = (type || "").toLowerCase() === "video";
  const { thumb } = useVideoThumbnail(isVideo ? url : undefined, 1.0);
  const { deleteMedia, deletingId } = useDeleteMedia();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this media?")) deleteMedia(id);
  };

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 cursor-pointer"
      title={url}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90
                   text-gray-600 hover:bg-white hover:text-red-600 border border-gray-200 z-10 shadow-sm"
      >
        {deletingId === id ? (
          <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
        ) : (
          <X size={16} />
        )}
      </button>

      {/* Media */}
      {isVideo ? (
        thumb ? (
          <img
            src={thumb}
            alt="video thumbnail"
            className="w-full aspect-square object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full aspect-square grid place-items-center bg-black/70 text-white">
            <Play className="h-10 w-10 opacity-90" />
          </div>
        )
      ) : (
        <img
          src={url}
          alt={type || "image"}
          loading="lazy"
          decoding="async"
          className="w-full aspect-square object-cover transition group-hover:scale-[1.02]"
        />
      )}

      {/* Badge */}
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
        {type || "image"} : {storage}MB
      </span>
    </div>
  );
};
