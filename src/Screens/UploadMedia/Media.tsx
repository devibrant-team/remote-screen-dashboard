import React, { useEffect, useMemo, useState } from "react";
import { Upload, ImagePlus, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { useGetMedia } from "../../ReactQuery/Media/useGetMedia";

const FALLBACK_IMG =
  "https://dummyimage.com/600x400/eeeeee/9aa0a6.png&text=Media";

// ------------------------------
// Skeleton Card
// ------------------------------
const SkeletonCard: React.FC = () => (
  <div className="relative aspect-square w-full rounded-2xl border border-gray-200 bg-white p-2">
    <div className="h-full w-full animate-pulse rounded-xl bg-gray-200" />
  </div>
);

// ------------------------------
// Empty State
// ------------------------------
const EmptyState: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <div className="flex h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
      <ImagePlus className="h-8 w-8 text-gray-500" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">No media yet</h3>
      <p className="mt-1 text-sm text-gray-600">Upload images or videos to get started.</p>
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

// ------------------------------
// Media Card (clickable)
// ------------------------------
const MediaCard: React.FC<{
  url: string;
  type?: string;
  title?: string;
  onClick?: () => void;
}> = ({ url, type, title, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-sm transition hover:shadow-md"
  >
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <img
        src={url}
        alt={title || "Media item"}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
        }}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        draggable={false}
      />

      {type ? (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {type}
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </div>
  </button>
);

// ------------------------------
// Lightbox Modal
// ------------------------------
const Lightbox: React.FC<{
  items: Array<{ id: number; media: string; type?: string }>;
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ items, index, onClose, onPrev, onNext }) => {
  const item = items[index];

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // lock background scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      {/* backdrop click closes */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-[101] mx-auto max-h-[85vh] max-w-[92vw]">
        {/* media container */}
        <div className="flex items-center justify-center">
          {item?.type === "video" ? (
            <video
              src={item.media}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl bg-black"
              controls
              autoPlay
            />
          ) : (
            <img
              src={item?.media || FALLBACK_IMG}
              alt="Preview"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            />
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow ring-1 ring-black/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Prev / Next */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="pointer-events-auto ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow ring-1 ring-black/10 backdrop-blur transition hover:bg-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="pointer-events-auto mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow ring-1 ring-black/10 backdrop-blur transition hover:bg-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// Pager
// ------------------------------
const Pager: React.FC<{
  page: number;
  lastPage: number;
  total?: number;
  onPrev: () => void;
  onNext: () => void;
  loading?: boolean;
}> = ({ page, lastPage, total, onPrev, onNext, loading }) => (
  <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 backdrop-blur">
    <div className="text-xs text-gray-600">
      Page <span className="font-semibold text-gray-900">{page}</span>
      <span className="text-gray-400"> / {Math.max(1, lastPage)}</span>
      {typeof total === "number" && (
        <span className="ml-2 text-gray-400">• {total} items</span>
      )}
    </div>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1 || loading}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition enabled:hover:bg-gray-50 disabled:opacity-50"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Prev
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= lastPage || loading}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition enabled:hover:bg-gray-50 disabled:opacity-50"
      >
        Next <ChevronRight className="ml-1 h-4 w-4" />
      </button>
    </div>
  </div>
);

// ------------------------------
// Page
// ------------------------------
const MediaPage: React.FC = () => {
  const PER_PAGE = 24;
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data, isPending, isFetching, isError, refetch } = useGetMedia({
    page,
    perPage: PER_PAGE,
  });

  const media: Array<{ id: number; media: string; type?: string }> = useMemo(
    () => (data?.media ?? []) as any,
    [data]
  );

  const meta = data?.meta;
  const lastPage = Number(meta?.last_page || 1);
  const total = Number(meta?.total ?? media.length ?? 0);
  const loading = isPending || isFetching;

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(lastPage, p + 1));

  const onUpload = () => {
    alert("Upload flow coming soon ✨");
  };

  const openLightbox = (idx: number) => setSelectedIndex(idx);
  const closeLightbox = () => setSelectedIndex(null);
  const prevItem = () =>
    setSelectedIndex((i) => (i === null ? i : Math.max(0, i - 1)));
  const nextItem = () =>
    setSelectedIndex((i) => (i === null ? i : Math.min(media.length - 1, i + 1)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Library</h1>
          <p className="mt-1 text-sm text-gray-600">Browse and manage your uploaded media.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--mainred,_#ef4444)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:opacity-100"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Content */}
      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load media. Please try again.
        </div>
      ) : loading && !media.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !media.length ? (
        <EmptyState onUpload={onUpload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {media.map((m, idx) => (
              <MediaCard key={m.id} url={m.media} type={m.type} onClick={() => openLightbox(idx)} />
            ))}
          </div>

          <Pager
            page={page}
            lastPage={lastPage}
            total={total}
            onPrev={handlePrev}
            onNext={handleNext}
            loading={loading}
          />
        </>
      )}

      {selectedIndex !== null && (
        <Lightbox
          items={media}
          index={selectedIndex}
          onClose={closeLightbox}
          onPrev={prevItem}
          onNext={nextItem}
        />
      )}
    </div>
  );
};

export default MediaPage;