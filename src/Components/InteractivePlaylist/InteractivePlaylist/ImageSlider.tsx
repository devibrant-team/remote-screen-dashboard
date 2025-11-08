import React, { useMemo, useRef, useState } from "react";

export type ImagePreview = {
  url: string;
  type?: "image" | "video";
  mediaId?: number;
  file?: File;
  source?: "library" | "upload";
};

type ImageSliderProps = {
  images: ImagePreview[];
  handleReplaceImage: (index: number, file: File) => void;
  handleDeleteImage: (index: number) => void;
  handleReorder: (newImages: ImagePreview[]) => void;
};

const PAGE_SIZE = 4;

const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  handleReplaceImage,
  handleDeleteImage,
  handleReorder,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(images.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const start = (clampedPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const visible = useMemo(() => images.slice(start, end), [images, start, end]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const onDragStart = (e: React.DragEvent, globalIndex: number) => {
    e.dataTransfer.setData("text/plain", String(globalIndex));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropOn = (e: React.DragEvent, dropGlobalIndex: number) => {
    e.preventDefault();
    const dragGlobalIndex = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(dragGlobalIndex) || dragGlobalIndex === dropGlobalIndex) return;

    const reordered = [...images];
    const [dragged] = reordered.splice(dragGlobalIndex, 1);
    reordered.splice(dropGlobalIndex, 0, dragged);
    handleReorder(reordered);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="relative">
      {/* 4 tiles per page */}
      <div
        ref={listRef}
        className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {visible.map((img, localIndex) => {
          const globalIndex = start + localIndex;

          return (
            <div
              key={`${img.mediaId ?? img.url ?? "f"}-${globalIndex}`}
              className="flex flex-col items-center relative group"
              draggable
              onDragStart={(e) => onDragStart(e, globalIndex)}
              onDragOver={onDragOver}
              onDrop={(e) => onDropOn(e, globalIndex)}
            >
              <div
                className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] border border-gray-300 rounded-xl overflow-hidden shadow bg-white relative cursor-move group"
                role="button"
                aria-label={`Slide ${globalIndex + 1}`}
                tabIndex={0}
              >
                {img.type === "video" ? (
                  <video
                    src={img.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    controls={false}
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={img.url}
                    alt={`preview-${globalIndex}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                )}

                {/* Replace overlay */}
                <div
                  onClick={() =>
                    document.getElementById(`replace-${globalIndex}`)?.click()
                  }
                  className="absolute inset-0 bg-gray-900/60 flex items-center justify-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Replace this slide"
                >
                  Replace
                </div>

                <input
                  id={`replace-${globalIndex}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleReplaceImage(globalIndex, f);
                  }}
                />

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteImage(globalIndex)}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
                  title="Delete Slide"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7L5 7M10 11v6m4-6v6M7 7h10l-1 13H8L7 7zM9 7V4h6v3"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-2 text-sm text-gray-700 font-medium text-center">
                Slide {globalIndex + 1}
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="col-span-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 p-6 text-sm text-slate-600 text-center">
            No slides on this page.
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={clampedPage === 1}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous"
          title="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Previous
        </button>

        <div className="text-xs text-slate-600">
          Page {clampedPage} / {totalPages} • Showing {visible.length} of {images.length}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={clampedPage >= totalPages}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next"
          title="Next"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ImageSlider;
