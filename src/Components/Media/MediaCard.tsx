import React, { useState } from "react";
import { Play, X, Check, Tag as TagIcon } from "lucide-react";
import { useVideoThumbnail } from "../../Hook/Playlist/useVideoThumbnail";
import { useDeleteMedia } from "../../ReactQuery/Media/DeleteMedia";
import { useConfirmDialog } from "../ConfirmDialogContext";

export const MediaCard: React.FC<{
  id: number | string;
  url: string;
  type?: string;
  storage: number | string; // 👈 allow string from API ("0.00")
  tag?: string|null; // 👈 NEW: tag label
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  order?: number;
  onToggleSelect?: () => void;
}> = ({
  id,
  url,
  type,
  storage,
  tag,
  onClick,
  selectable = false,
  selected = false,
  order,
  onToggleSelect,
}) => {
  const isVideo = (type || "").toLowerCase() === "video";
  const { thumb } = useVideoThumbnail(isVideo ? url : undefined, 1.0);
  const { deleteMedia, deletingId } = useDeleteMedia();
  const confirm = useConfirmDialog();
  const [imgError, setImgError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete media",
      message:
        "Are you sure you want to delete this media item? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;
    deleteMedia(id);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgError(false);
    setRetryKey((k) => k + 1);
  };

  const handleCardClick = () => {
    if (selectable) onToggleSelect?.();
    else onClick?.();
  };

  // normalize storage a bit for display
  const storageLabel =
    storage === undefined || storage === null || storage === ""
      ? ""
      : `${storage} MB`;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden rounded-xl border bg-gray-50 cursor-pointer transition
      ${
        selectable && selected
          ? "border-red-500 ring-2 ring-red-300/60 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
      title={url}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (selectable) onToggleSelect?.();
          else onClick?.();
        }
      }}
    >
      {/* Top-right control: delete OR select */}
      {selectable ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          aria-pressed={selected}
          className={`absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full border shadow-sm
            px-0.5 py-0.5 text-[11px] font-medium transition
            ${
              selected
                ? "bg-red-500 text-white border-red-500"
                : "bg-white/95 text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-red-300"
            }`}
        >
          {selected ? (
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Check className="h-3 w-3" />
              </span>
              {order != null ? (
                <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] leading-none">
                  {order}
                </span>
              ) : (
                <span className="pr-0.5 text-[10px] leading-none">
                  Selected
                </span>
              )}
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center">
              <div className="h-5 w-5 rounded-full bg-black/20 transition-transform group-hover:scale-105" />
            </div>
          )}
        </button>
      ) : (
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
      )}

      {/* 🔴 Top-left: tag pill */}
      {tag && (
        <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-gray-800 shadow-sm">
          <TagIcon className="h-3 w-3 text-red-500" />
          <span className="max-w-[80px] truncate">{tag}</span>
        </span>
      )}

      {/* Media */}
      {isVideo ? (
        !imgError && thumb ? (
          <img
            key={retryKey}
            src={thumb}
            alt="video thumbnail"
            className="w-full aspect-square object-cover transition group-hover:scale-[1.02]"
            onError={() => setImgError(true)}
          />
        ) : imgError ? (
          <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-gray-100 text-xs text-gray-500">
            <span>Failed to load preview</span>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="w-full aspect-square grid place-items-center bg-black/70 text-white">
            <Play className="h-10 w-10 opacity-90" />
          </div>
        )
      ) : !imgError ? (
        <img
          key={retryKey}
          src={url}
          alt={type || "image"}
          loading="lazy"
          decoding="async"
          className="w-full aspect-square object-cover transition group-hover:scale-[1.02]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-gray-100 text-xs text-gray-500">
          <span>Failed to load image</span>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* 🔴 Bottom-left: simple storage chip (hidden in select mode) */}
      {!selectable && storageLabel && (
        <span className="pointer-events-none absolute left-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
          {storageLabel}
        </span>
      )}
    </div>
  );
};
