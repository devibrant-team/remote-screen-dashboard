// src/components/UserMediaGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetMedia,
  type MediaItem,
  type AllowedType,
} from "../../ReactQuery/Media/useGetMedia";
import {
  toggleMediaSelection,
  selectSelectedMediaIds,
} from "../../Redux/Media/MediaSlice";

type Props = { className?: string };

const PER_PAGE = 6;
const CARD_SIZE = 110;

const ARROW_DIAM = 40; // ⌀ of the circular arrow button
const ARROW_GAP = 12; // extra gap between arrow and first/last card

const cx = (...a: Array<string | false | null | undefined>) =>
  a.filter(Boolean).join(" ");

export default function UserMediaGrid({ className }: Props) {
  const dispatch = useDispatch();
  const selectedIds = useSelector(selectSelectedMediaIds);

  // ---- pagination
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching, isError, refetch } = useGetMedia({
    page,
    perPage: PER_PAGE,
  });
console.log("loloo",data)
  const media: MediaItem[] = data?.media ?? [];
  const items = useMemo(() => media.slice(0, PER_PAGE), [media]); // hard-cap to 6 just in case
  const pages = Math.max(1, data?.meta?.last_page ?? 1);

  useEffect(() => {
    setPage((p) => Math.min(p, pages));
  }, [pages]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(pages, p + 1));

  // skeletons (6 blocks)
  const Skeletons = useMemo(
    () =>
      Array.from({ length: PER_PAGE }).map((_, i) => (
        <div
          key={`sk-${i}`}
          className="flex-none rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 animate-pulse"
          style={{ width: CARD_SIZE, height: CARD_SIZE }}
        />
      )),
    []
  );

  // show skeleton while initial load OR switching pages
  const showSkeleton = isPending || isFetching;

  const normalizeType = (t?: string): AllowedType | undefined =>
    t === "image" ? "image" : t === "video" ? "video" : undefined;

  const onToggle = (id: number, url: string, type?: AllowedType) => {
    // Only allow images for the interactive slider
    if (type && type !== "image") {
      alert("Only images can be added (videos are not supported yet).");
      return;
    }
    dispatch(toggleMediaSelection({ id, url, type }));
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <div className="text-sm font-medium text-slate-700">Media</div>

      <div className="relative">
        <div
          className={cx(
            "flex gap-3 overflow-x-auto scroll-smooth whitespace-nowrap",
            "rounded-xl border border-slate-200/70 bg-white/70 py-2",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          )}
          style={{
            height: CARD_SIZE + 16,
            // reserve space so arrows don't overlap cards
            paddingLeft: ARROW_DIAM + ARROW_GAP,
            paddingRight: ARROW_DIAM + ARROW_GAP,
          }}
          aria-busy={showSkeleton}
        >
          {isError && !showSkeleton && (
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

          {!isError && showSkeleton && Skeletons}

          {!isError && !showSkeleton && items.length === 0 && (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 px-4 text-sm text-slate-600">
              No media uploaded
            </div>
          )}

          {!isError &&
            !showSkeleton &&
            items.map((m) => {
              const selected = selectedIds.includes(m.id);
              const safeType = normalizeType(m.type);

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onToggle(m.id, m.media, safeType)}
                  aria-pressed={selected}
                  className={cx(
                    "relative flex-none overflow-hidden transition-all duration-200 rounded-xl",
                    "ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md active:scale-[0.99]",
                    selected &&
                      "ring-2 ring-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                  )}
                  style={{ width: CARD_SIZE, height: CARD_SIZE }}
                  title={safeType}
                >
                  {safeType === "video" ? (
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
                      src={m.media}
                      alt={`media-${m.id}`}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover transform transition-transform duration-300 will-change-transform hover:scale-[1.02]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>No preview</text></svg>";
                      }}
                    />
                  )}

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

        {pages > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={page === 1 || isFetching || isPending}
              className={cx(
                "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                "rounded-full bg-white/90 shadow ring-1 ring-slate-200",
                "hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center" // center the icon inside
              )}
              style={{ width: ARROW_DIAM, height: ARROW_DIAM }}
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
              disabled={page >= pages || isFetching || isPending}
              className={cx(
                "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                "rounded-full bg-white/90 shadow ring-1 ring-slate-200",
                "hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center"
              )}
              style={{ width: ARROW_DIAM, height: ARROW_DIAM }}
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
              Page {page} / {pages}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
