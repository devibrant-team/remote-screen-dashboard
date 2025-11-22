import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  ImagePlus,
  RefreshCw,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"; // 👈 added ChevronLeft/Right
import { useDispatch, useSelector } from "react-redux";
import { useGetMedia } from "../../ReactQuery/Media/useGetMedia";
import { MediaCard } from "../../Components/Media/MediaCard";
import { Lightbox } from "../../Components/Models/LightboxModal";
import { Pager } from "../../Components/Media/Pager";
import {
  setItems,
  setMeta,
  setLoading,
  openLightbox,
} from "../../Redux/Media/MediaLibrarySlice";
import type { RootState } from "../../../store";
import { useUploadMedia } from "../../ReactQuery/Media/PostMedia";
import TagModal from "@/Components/Models/TagModal";
import {
  ACCEPT_ATTR,
  filterDisallowed,
} from "../../Hook/Playlist/AllowedUploadExt";

import { useGetTags } from "@/ReactQuery/Tag/GetTag";
import { MediaBottomBar } from "@/Components/Media/MediaBottomBar";
import {
  clearMedia,
  setMediaIds,
  setSelectedTagId,
} from "@/ReactQuery/Tag/TagSlice";

// pdf.js
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?worker&url";

GlobalWorkerOptions.workerSrc = workerSrc;

// skeleton + empty state
const SkeletonCard: React.FC = () => (
  <div className="relative aspect-square w-full rounded-2xl border border-gray-200 bg-white p-2">
    <div className="h-full w-full animate-pulse rounded-xl bg-gray-200" />
  </div>
);

const EmptyState: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <div className="flex h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
      <ImagePlus className="h-8 w-8 text-gray-500" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">No media yet</h3>
      <p className="mt-1 text-sm text-gray-600">
        Upload images or videos to get started.
      </p>
    </div>
    <button
      type="button"
      onClick={onUpload}
      className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:opacity-100"
    >
      <Upload className="h-4 w-4" /> Upload media
    </button>
  </div>
);

// pdf helper
async function pdfToImages(
  pdfFile: File,
  opts?: {
    dpi?: number;
    format?: "image/webp" | "image/jpeg";
    quality?: number;
    onPage?: (i: number, n: number) => void;
  }
): Promise<File[]> {
  const {
    dpi = 144,
    format = "image/webp",
    quality = 0.92,
    onPage,
  } = opts ?? {};
  const buf = await pdfFile.arrayBuffer();
  const pdf = (await getDocument({ data: buf }).promise) as PDFDocumentProxy;

  const out: File[] = [];
  const scale = dpi / 72;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onPage?.(pageNum, pdf.numPages);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    if (!ctx) throw new Error("2D context not available");

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    });
    await renderTask.promise;

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), format, quality)
    );

    const ext = format === "image/jpeg" ? "jpg" : "webp";
    const nameBase = pdfFile.name.replace(/\.pdf$/i, "");
    const fileName = `${nameBase}-page-${String(pageNum).padStart(
      2,
      "0"
    )}.${ext}`;
    out.push(new File([blob], fileName, { type: format }));

    canvas.width = 0;
    canvas.height = 0;
  }
  return out;
}

const TAGS_PER_PAGE = 10; // 👈 show 10 tags per "page"

const MediaPage: React.FC = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isSelectable, setIsSelectable] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [tagPage, setTagPage] = useState(0); // 👈 current page of tags

  const selectedTagId = useSelector((s: RootState) => s.tag.selectedTagId);

  const upload = useUploadMedia();

  const { page, perPage, items, loading } = useSelector(
    (s: RootState) => s.mediaLibrary
  );

  const { data, isPending, isFetching, isError, refetch } = useGetMedia({
    page,
    perPage,
    tagId:
      selectedTagId === "all" || selectedTagId === undefined
        ? null
        : selectedTagId,
  });

  const {
    data: tags = [],
    isLoading: tagsLoading,
    isError: tagsError,
  } = useGetTags();

  // 👇 Clamp tagPage when tags length changes
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(tags.length / TAGS_PER_PAGE) - 1);
    if (tagPage > maxPage) {
      setTagPage(maxPage);
    }
  }, [tags.length, tagPage]);

  // mirror loading
  useEffect(() => {
    dispatch(setLoading(isPending || isFetching));
  }, [isPending, isFetching, dispatch]);

  // push items
  useEffect(() => {
    if (!data) return;
    dispatch(setItems(data.media ?? []));
    dispatch(
      setMeta({
        last_page: Number(data.meta?.last_page || 1),
        total: Number(data.meta?.total || (data.media?.length ?? 0)),
      })
    );
  }, [data, dispatch]);

  // keep redux TagSlice.mediaIds in sync with selectedIds
  useEffect(() => {
    dispatch(setMediaIds(selectedIds));
  }, [selectedIds, dispatch]);

  const onUpload = () => fileInputRef.current?.click();

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || []);
    if (!all.length) return;

    const { good, bad } = filterDisallowed(all);

    if (bad.length) {
      const firstFew = bad
        .slice(0, 3)
        .map((f) => f.name)
        .join(", ");
      setErrorMsg(
        `Only images/videos/PDFs are allowed. Blocked: ${firstFew}${
          bad.length > 3 ? `, +${bad.length - 3} more` : ""
        }`
      );
    } else {
      setErrorMsg(null);
    }

    if (!good.length) {
      e.currentTarget.value = "";
      return;
    }

    try {
      const expanded: File[] = [];
      for (const f of good) {
        if (f.type === "application/pdf") {
          setRenderStatus(`Rendering ${f.name} (preparing pages)…`);
          const imgs = await pdfToImages(f, {
            dpi: 144,
            format: "image/webp",
            quality: 0.92,
            onPage: (i, n) =>
              setRenderStatus(`Rendering ${f.name}: page ${i}/${n}…`),
          });
          expanded.push(...imgs);
        } else {
          expanded.push(f);
        }
      }

      if (!expanded.length) {
        setErrorMsg("No renderable pages/files found.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setRenderStatus(null);
        return;
      }

      setRenderStatus(null);
      setProgress(0);
      upload.mutate(
        { files: expanded, onProgress: (p: number) => setProgress(p) },
        {
          onError: (err: any) => {
            const msg =
              err?.response?.data?.message ??
              "Upload failed. Please try again.";
            setErrorMsg(msg);
          },
          onSettled: () => {
            setProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          },
        }
      );
    } catch (err: any) {
      setRenderStatus(null);
      setProgress(null);
      setErrorMsg(err?.message ?? "Failed to process PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTagFilterClick = (tagId: number | string | "all") => {
    dispatch(setSelectedTagId(tagId));

  };

  // 👇 compute visible tags for current page
  const totalTagPages =
    tags.length > 0 ? Math.ceil(tags.length / TAGS_PER_PAGE) : 1;
  const start = tagPage * TAGS_PER_PAGE;
  const end = start + TAGS_PER_PAGE;
  const visibleTags = tags.slice(start, end);

  const canGoPrev = tagPage > 0;
  const canGoNext = tagPage < totalTagPages - 1;

  return (
    <>
      <div className="mx-10 max-w-9xl px-4 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Library
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage, Tag, and filter your media
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading || upload.isPending}
              className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 hover:scale-[0.9]"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading || upload.isPending ? "animate-spin" : ""
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSelectable((prev) => !prev);
                setSelectedIds([]);
                dispatch(clearMedia());
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border font-semibold cursor-pointer px-3 py-2 text-sm shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40
                ${
                  isSelectable
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-red-500 border-gray-200 hover:bg-red-500 hover:text-white"
                }`}
            >
              <Tag className="h-4 w-4 " />
              <span>{isSelectable ? "Cancel Tagging" : "Tag's Media"}</span>
            </button>

            <button
              type="button"
              onClick={onUpload}
              disabled={upload.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border cursor-pointer text-red-500 border-gray-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-500 hover:text-white"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending
                ? progress != null
                  ? `Uploading ${progress}%`
                  : "Uploading…"
                : "Upload"}
            </button>
          </div>
        </div>

        {/* 🔴 Tags header row with pagination & skeleton */}
        <div className="mb-5">
          {tagsLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-3 overflow-x-hidden">
                <div className="h-7 w-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-7 w-16 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-7 w-20 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-7 w-14 rounded-full bg-gray-100 animate-pulse" />
              </div>
            </div>
          ) : tagsError ? (
            <div className="text-xs text-red-500">
              Failed to load tags filter.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                {/* Prev arrow (only if more than one page) */}
                {tags.length > TAGS_PER_PAGE && (
                  <button
                    type="button"
                    onClick={() => canGoPrev && setTagPage((p) => p - 1)}
                    disabled={!canGoPrev}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs shadow-sm transition
                      ${
                        canGoPrev
                          ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                )}

                <div className="flex flex-1 items-center gap-4 overflow-hidden">
                  {/* All option (always visible) */}
                  {/* All option (always visible) */}
                  <button
                    type="button"
                    onClick={() => handleTagFilterClick("all")}
                    className={`relative pb-2 text-xs font-medium whitespace-nowrap transition
    ${
      selectedTagId === "all"
        ? "text-red-600"
        : "text-gray-600 hover:text-gray-800"
    }`}
                  >
                    All
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition
      ${selectedTagId === "all" ? "bg-red-500" : "bg-transparent"}`}
                    />
                  </button>

                  {/* 🔴 Non Tag option → selectedTagId = 0 */}
                  <button
                    type="button"
                    onClick={() => handleTagFilterClick(0)}
                    className={`relative pb-2 text-xs font-medium whitespace-nowrap transition
    ${
      selectedTagId === 0 ? "text-red-600" : "text-gray-600 hover:text-gray-800"
    }`}
                  >
                    Non Tag
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition
      ${selectedTagId === 0 ? "bg-red-500" : "bg-transparent"}`}
                    />
                  </button>

                  {/* visible tags for current page */}
                  <div className="flex items-center gap-4 overflow-hidden">
                    {visibleTags.map((t) => {
                      const isActive = selectedTagId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTagFilterClick(t.id)}
                          className={`relative pb-2 text-xs font-medium whitespace-nowrap transition
                            ${
                              isActive
                                ? "text-red-600"
                                : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                          {t.name}
                          <span
                            className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition
                              ${isActive ? "bg-red-500" : "bg-transparent"}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next arrow (only if more than one page) */}
                {tags.length > TAGS_PER_PAGE && (
                  <button
                    type="button"
                    onClick={() => canGoNext && setTagPage((p) => p + 1)}
                    disabled={!canGoNext}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs shadow-sm transition
                      ${
                        canGoNext
                          ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status banners */}
        {renderStatus && (
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {renderStatus}
          </div>
        )}
        {errorMsg && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {errorMsg}
          </div>
        )}

        {/* Content */}
        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to load media. Please try again.
          </div>
        ) : loading && !items.length ? (
          // initial load skeleton grid
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: perPage }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState onUpload={onUpload} />
        ) : (
          <>
            {/* grid + overlay skeleton when refetching with previous data */}
            <div className="relative">
              {isFetching && !isPending && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/40 backdrop-blur-[1px]">
                  <div className="mt-10 flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((m, idx) => {
                  const selectedIndex = selectedIds.findIndex(
                    (id) => id === m.id
                  );
                  const isSelected = selectedIndex !== -1;

                  return (
                    <MediaCard
                      key={m.id}
                      id={m.id}
                      storage={m.storage}
                      url={m.media}
                      tag={m.tag}
                      type={m.type}
                      selectable={isSelectable}
                      selected={isSelected}
                      order={isSelected ? selectedIndex + 1 : undefined}
                      onToggleSelect={() => {
                        setSelectedIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== m.id)
                            : [...prev, m.id]
                        );
                      }}
                      onClick={
                        isSelectable
                          ? undefined
                          : () => dispatch(openLightbox(idx))
                      }
                    />
                  );
                })}
              </div>

              <Pager />
            </div>
          </>
        )}

        {/* Lightbox */}
        <Lightbox />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={handlePick}
        />
      </div>

      {/* Tag modal */}
      <TagModal
        open={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
      />

      {/* Bottom bar */}
      <MediaBottomBar
        selectedCount={isSelectable ? selectedIds.length : 0}
        onClear={() => {
          setSelectedIds([]);
          dispatch(clearMedia());
        }}
        onAssign={() => {
          if (!selectedIds.length) return;
          setIsTagModalOpen(true);
        }}
      />
    </>
  );
};

export default MediaPage;
