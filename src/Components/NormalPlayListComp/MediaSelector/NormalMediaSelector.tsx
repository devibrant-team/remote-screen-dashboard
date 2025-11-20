// Components/.../MediaSelector/NormalMediaSelector.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RefreshCw,
  Upload,
  Film,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useGetMedia } from "../../../ReactQuery/Media/useGetMedia";
import {
  updateSlideAtIndex,
  updateSlotInSlide,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { store } from "../../../../store";
import {
  ACCEPT_ATTR,
  filterDisallowed,
} from "../../../Hook/Playlist/AllowedUploadExt";

import { useGetTags } from "../../../ReactQuery/Tag/GetTag";
import { setSelectedTagId } from "../../../ReactQuery/Tag/TagSlice";
import type { RootState } from "../../../../store";

type Props = {
  open: boolean;
  onClose: () => void;
  slideIndex: number;
  slotIndex: number;
};

type MediaItem = { id: number; type: string; media: string , tag:string };

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const perPage = 6;

  // 🔴 current selected tag (from global TagSlice)
  const selectedTagId = useSelector(
    (s: RootState) => s.tag.selectedTagId
  ) as number | string | "all" | undefined;

  // 🔴 fetch media with tag filter
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetMedia({
    page,
    perPage,
    tagId:
      selectedTagId === "all" || selectedTagId === undefined
        ? null
        : selectedTagId,
  });

  // 🔴 fetch tags for header
  const {
    data: tags = [],
    isLoading: tagsLoading,
    isError: tagsError,
  } = useGetTags();

  const items = data?.media ?? [];
  const meta = data?.meta;

  const [uploading, setUploading] = useState(false);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const applyVideo = (
    mediaUrl: string,
    imageFile: File | null,
    mediaId: number | null
  ) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = mediaUrl;
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration || 0);
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
        duration: duration > 0 ? duration : 10,
      };
      dispatch(
        updateSlideAtIndex({ index: slideIndex, updatedSlide: latest })
      );
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
      dispatch(
        updateSlideAtIndex({ index: slideIndex, updatedSlide: latest })
      );
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
        dispatch(
          updateSlideAtIndex({ index: slideIndex, updatedSlide: latest })
        );
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleTagClick = (tagId: number | string | "all") => {
    // reset to first page when changing tag
    setPage(1);
    dispatch(setSelectedTagId(tagId));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="relative z-10 w-[min(1200px,96vw)] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2
            id="media-modal-title"
            className="text-base font-semibold text-gray-900"
          >
            Choose media
          </h2>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs cursor-pointer hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Upload
              <input
                type="file"
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => {
                  const all = Array.from(e.target.files || []);
                  if (!all.length) return;
                  const [file] = all;
                  const { good, bad } = filterDisallowed([file]);

                  if (bad.length) {
                    setErrorMsg(
                      "Only images/videos are allowed (jpeg,png,jpg,gif,webp,mp4,mov,avi)."
                    );
                    e.currentTarget.value = "";
                    return;
                  }

                  setErrorMsg(null);
                  handleUpload(good[0]);
                  e.currentTarget.value = "";
                }}
                disabled={uploading}
              />
            </label>

            <button
              onClick={() => refetch()}
              disabled={isFetching || uploading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              onClick={onClose}
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
              aria-label="Close"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[calc(90vh-56px)] overflow-auto p-4">
          {/* 🔴 Tags filter row */}
          <div className="mb-3">
            {tagsLoading ? (
              <div className="flex gap-2">
                <div className="h-7 w-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-7 w-16 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-7 w-20 rounded-full bg-gray-100 animate-pulse" />
              </div>
            ) : tagsError ? (
              <div className="text-[11px] text-red-500">
                Failed to load tags filter.
              </div>
            ) : (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {/* All */}
                <button
                  type="button"
                  onClick={() => handleTagClick("all")}
                  className={`relative pb-1 text-[11px] font-medium whitespace-nowrap transition
                    ${
                      selectedTagId === "all"
                        ? "text-red-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  All
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition
                      ${
                        selectedTagId === "all"
                          ? "bg-red-500"
                          : "bg-transparent"
                      }`}
                  />
                </button>

                {tags.map((t: { id: number | string; name: string }) => {
                  const isActive = selectedTagId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTagClick(t.id)}
                      className={`relative pb-1 text-[11px] font-medium whitespace-nowrap transition
                        ${
                          isActive
                            ? "text-red-600"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      {t.name}
                      <span
                        className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition
                          ${
                            isActive ? "bg-red-500" : "bg-transparent"
                          }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {errorMsg}
            </div>
          )}

          {/* 🔴 Content with MediaPage-style loading behavior */}
          {isError ? (
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
          ) : isLoading && items.length === 0 ? (
            // initial load skeleton grid
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-600">
              No media for this filter.
            </div>
          ) : (
            <>
              {/* grid + overlay skeleton when refetching with previous data */}
              <div className="relative">
                {isFetching && !isLoading && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/40 backdrop-blur-[1px]">
                    <div className="mt-10 flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                    </div>
                  </div>
                )}

                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                  {items.map((item: MediaItem) => {
                    const isVideo =
                      item.type === "video" ||
                      item.type?.startsWith("video");
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
                          {isVideo ? (
                            <Film className="h-3 w-3" />
                          ) : (
                            <ImageIcon className="h-3 w-3" />
                          )}
                          <span>{isVideo ? "Video" : "Image"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

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
                      onClick={() =>
                        setPage((p) =>
                          meta ? Math.min(meta.last_page, p + 1) : p + 1
                        )
                      }
                      disabled={
                        meta.current_page >= meta.last_page || isFetching
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NormalMediaSelector;
