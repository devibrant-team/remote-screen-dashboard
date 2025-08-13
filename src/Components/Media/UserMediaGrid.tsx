// src/components/Media/UserMediaGrid.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetMedia, type MediaItem } from "../../Hook/Media/useGetMedia";

type SingleProps = {
  mode?: "single";
  selectedId?: number | null;
  onSelect?: (item: MediaItem) => void;
};

type MultiProps = {
  mode: "multi";
  selectedIds: number[];
  onToggle: (item: MediaItem) => void;
};

type Common = {
  className?: string;
  /** Max height for "normal" grid. Ignored for "interactive". */
  maxHeight?: number;
  /** "interactive" = horizontal slider; "normal" = simple grid (default) */
  variant?: "interactive" | "normal";
  /** Only for interactive: how many items to jump per click */
  itemsPerPage?: number;
  /** Only for interactive: square card size (px) */
  cardSize?: number; // default 110
};

type Props = (SingleProps | MultiProps) & Common;

const cx = (...a: Array<string | false | null | undefined>) =>
  a.filter(Boolean).join(" ");

export default function UserMediaGrid({
  mode = "single",
  className,
  maxHeight = 320,
  variant = "normal",
  itemsPerPage = 5,
  cardSize = 110,
  ...rest
}: Props) {
  const { data: media, isLoading, isError, refetch } = useGetMedia();
  const isInteractive = variant === "interactive";

  // ----- INTERACTIVE slider state -----
  const rowRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const total = media?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / itemsPerPage));

  useEffect(() => {
    // clamp page if data changes
    setPage((p) => Math.min(p, Math.max(0, pages - 1)));
  }, [pages]);

  const scrollToPage = (p: number) => {
    const container = rowRef.current;
    if (!container) return;
    const startIndex = p * itemsPerPage;
    const child = container.children[startIndex] as HTMLElement | undefined;
    if (child) {
      container.scrollTo({
        left: child.offsetLeft - container.offsetLeft,
        behavior: "smooth",
      });
    } else {
      // fallback: approximate
      const approx = p * (cardSize + 12) * itemsPerPage;
      container.scrollTo({ left: approx, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    const np = Math.max(0, page - 1);
    setPage(np);
    scrollToPage(np);
  };
  const goNext = () => {
    const np = Math.min(pages - 1, page + 1);
    setPage(np);
    scrollToPage(np);
  };

  // ----- selection helpers -----
  const isItemSelected = (id: number) =>
    mode === "multi"
      ? (rest as MultiProps).selectedIds?.includes(id)
      : (rest as SingleProps).selectedId === id;

  const handleItemClick = (item: MediaItem) => {
    if (mode === "multi") (rest as MultiProps).onToggle(item);
    else (rest as SingleProps).onSelect?.(item);
  };

  // Common Pieces
  const Loading = useMemo(
    () =>
      Array.from({ length: isInteractive ? itemsPerPage : 6 }).map((_, i) => (
        <div
          key={`sk-${i}`}
          className={cx(
            "bg-gradient-to-br from-slate-200 to-slate-100 animate-pulse",
            isInteractive ? "rounded-xl" : "rounded-lg",
            isInteractive
              ? "flex-none"
              : "w-full",
            isInteractive ? `w-[${cardSize}px] h-[${cardSize}px]` : "aspect-square"
          )}
          style={isInteractive ? { width: cardSize, height: cardSize } : undefined}
        />
      )),
    [isInteractive, itemsPerPage, cardSize]
  );

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <div className="text-sm font-medium text-slate-700">Media</div>

      {/* ---------- INTERACTIVE: HORIZONTAL SLIDER ---------- */}
      {isInteractive ? (
        <div className="relative">
          {/* Row */}
          <div
            ref={rowRef}
            className={cx(
              "flex gap-3 overflow-x-auto scroll-smooth whitespace-nowrap",
              "rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2",
              // hide scrollbar cross-browser
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}
            style={{
              // compact height
              height: cardSize + 16, // card + modest padding
            }}
          >
            {isLoading && Loading}

            {isError && !isLoading && (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-600">
                Failed to load media.
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="ml-3 rounded-md bg-red-600 px-3 py-1.5 text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !isError && (!media || media.length === 0) && (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 px-4 text-sm text-slate-600">
                No media uploaded
              </div>
            )}

            {media?.map((item) => {
              const selected = isItemSelected(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  aria-pressed={selected}
                  className={cx(
                    "relative flex-none overflow-hidden transition-all duration-200",
                    "ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md active:scale-[0.99]",
                    selected &&
                      "ring-2 ring-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
                    "rounded-xl"
                  )}
                  style={{ width: cardSize, height: cardSize }}
                  title={item.type}
                >
                  {item.type === "video" ? (
                    <div className="flex h-full w-full items-center justify-center bg-black text-white">
                      <div className="flex items-center gap-2 text-xs opacity-90">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Video
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.media}
                      alt={`media-${item.id}`}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover transform transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>No preview</text></svg>";
                      }}
                    />
                  )}

                  {/* Selected badge */}
                  {selected && (
                    <>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Selected
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Nav buttons */}
          {total > itemsPerPage && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={page === 0}
                className={cx(
                  "absolute left-1 top-1/2 -translate-y-1/2 z-10",
                  "rounded-full bg-white/90 shadow ring-1 ring-slate-200 p-2",
                  "hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Previous"
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
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={page >= pages - 1}
                className={cx(
                  "absolute right-1 top-1/2 -translate-y-1/2 z-10",
                  "rounded-full bg-white/90 shadow ring-1 ring-slate-200 p-2",
                  "hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Next"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <div className="mt-1 text-[11px] text-right text-slate-500">
                Page {page + 1} / {pages}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ---------- NORMAL: 3-COL GRID ---------- */
        <div
          className={cx("grid gap-2 pr-1")}
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            maxHeight,
            overflowY: "auto",
          }}
        >
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`nsk-${i}`}
                className="aspect-square rounded-lg bg-slate-200 animate-pulse"
              />
            ))}

          {isError && !isLoading && (
            <div className="col-span-3 flex flex-col items-center justify-center rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
              Failed to load media.
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 rounded-md bg-red-500 px-3 py-1 text-white hover:opacity-90"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && (!media || media.length === 0) && (
            <div className="col-span-3 flex items-center justify-center rounded-lg bg-slate-100 p-6 text-sm text-slate-600">
              No media uploaded
            </div>
          )}

          {media?.map((item) => {
            const selected = isItemSelected(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cx(
                  "relative aspect-square w-full overflow-hidden rounded-lg cursor-pointer focus:outline-none",
                  selected ? "ring-2 ring-red-500" : "ring-1 ring-slate-200"
                )}
                title={item.type}
              >
                {item.type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                    <span className="text-xs">Video</span>
                  </div>
                ) : (
                  <img
                    src={item.media}
                    alt={`media-${item.id}`}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>No preview</text></svg>";
                    }}
                  />
                )}

                {selected && <div className="absolute inset-0 bg-black/20" />}
                {selected && (
                  <div className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
