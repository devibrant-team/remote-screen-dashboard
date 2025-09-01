// Components/.../MediaSelector/NormalMediaSelector.tsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { RefreshCw, Upload, Film, Image as ImageIcon } from "lucide-react";
import { useGetMedia } from "../../../ReactQuery/Media/useGetMedia";
import {
  updateSlideAtIndex,
  updateSlotInSlide,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { store } from "../../../../store";
import BaseModal from "../../Models/BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
  slideIndex: number;
  slotIndex: number;
};

type MediaItem = { id: number; type: string; media: string };

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden">
    <div className="aspect-[4/3] bg-gray-100" />
    <div className="p-2">
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  </div>
);

const NormalMediaSelector: React.FC<Props> = ({
  open,
  onClose,
  slideIndex,
  slotIndex,
}) => {
  const dispatch = useDispatch();

  // NEW: local paging (optional)
  const [page, setPage] = useState(1);
  const perPage = 6;

  const {
    data,              // <-- PaginatedMedia | undefined
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetMedia({ page, perPage });

  // Safely access items/meta from paginated response
  const items = data?.media ?? [];
  const meta = data?.meta;

  const [uploading, setUploading] = useState(false);

  const applyVideo = (
    mediaUrl: string,
    imageFile: File | null,
    mediaId: number | null
  ) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = mediaUrl;
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      dispatch(
        updateSlotInSlide({
          slideIndex,
          slotIndex,
          media: mediaUrl,
          mediaType: "video",
          ImageFile: imageFile,
          mediaId,
        })
      );
      const latest = {
        ...store.getState().playlist.slides[slideIndex],
        duration,
      };
      dispatch(updateSlideAtIndex({ index: slideIndex, updatedSlide: latest }));
      onClose();
    };
  };

  const handlePick = (item: MediaItem) => {
    const isVideo = item.type === "video" || item.type?.startsWith("video");
    if (isVideo) {
      applyVideo(item.media, null, item.id);
    } else {
      dispatch(
        updateSlotInSlide({
          slideIndex,
          slotIndex,
          media: item.media,
          mediaType: "image",
          ImageFile: null,
          mediaId: item.id,
        })
      );
      const latest = {
        ...store.getState().playlist.slides[slideIndex],
        duration: 10,
      };
      dispatch(updateSlideAtIndex({ index: slideIndex, updatedSlide: latest }));
      onClose();
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video");
      if (isVideo) {
        applyVideo(url, file, null);
      } else {
        dispatch(
          updateSlotInSlide({
            slideIndex,
            slotIndex,
            media: url,
            mediaType: "image",
            ImageFile: file,
            mediaId: null,
          })
        );
        const latest = {
          ...store.getState().playlist.slides[slideIndex],
          duration: 10,
        };
        dispatch(updateSlideAtIndex({ index: slideIndex, updatedSlide: latest }));
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Choose media">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-1 pb-3">
          <div className="text-sm font-semibold text-gray-800">My Media</div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs cursor-pointer hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Upload
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleUpload(e.target.files[0])
                }
                disabled={uploading}
              />
            </label>
            <button
              onClick={() => refetch()}
              disabled={isFetching || uploading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="pb-1">
          {isLoading && (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="mb-1 font-medium">Error loading media</p>
              <p className="mb-2">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-600">
              No media yet.
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item: MediaItem) => {
                  const isVideo =
                    item.type === "video" || item.type?.startsWith("video");
                  return (
                    <button
                      key={item.id}
                      onClick={() => handlePick(item)}
                      className="group relative rounded-xl border-2 border-gray-300 bg-white overflow-hidden hover:shadow-sm transition text-left"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                        {isVideo ? (
                          <video
                            src={item.media}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            preload="metadata"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.media}
                            alt={`media-${item.id}`}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                        )}
                      </div>

                      <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {isVideo ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        <span>{isVideo ? "Video" : "Image"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional: simple pagination */}
              {meta && (
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <button
                    className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                  >
                    Prev
                  </button>
                  <span>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <button
                    className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setPage((p) => (meta ? Math.min(meta.last_page, p + 1) : p + 1))}
                    disabled={meta.current_page >= meta.last_page || isFetching}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default NormalMediaSelector;
