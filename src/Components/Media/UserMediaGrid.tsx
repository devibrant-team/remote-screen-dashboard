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
import type { RootState } from "../../../store";
import { selectInteractiveLayoutId } from "../../Redux/Playlist/interactivePlaylist/interactiveSlice";
import { useAlertDialog } from "@/AlertDialogContext";

type Props = {
  className?: string;
  /** 👇 total slides already in the slider (uploads + library in slides state) */
  currentSlidesCount?: number;
  /** 👇 unified cap coming from useSharedSlides (Number.POSITIVE_INFINITY if undefined) */
  maxSelectable?: number;
};

const PER_PAGE = 6;
const CARD_SIZE = 110;
const ARROW_DIAM = 40;
const ARROW_GAP = 12;

// Keep in sync with your slice caps (2 -> 5, 3 -> 2; others = no cap)
const LAYOUT_CAPS: Record<number, number> = { 2: 5, 3: 2 };
const getCapForLayout = (layoutId?: number): number | undefined =>
  typeof layoutId === "number" && layoutId in LAYOUT_CAPS
    ? LAYOUT_CAPS[layoutId]
    : undefined;

const cx = (...a: Array<string | false | null | undefined>) =>
  a.filter(Boolean).join(" ");

export default function UserMediaGrid({
  className,
  currentSlidesCount,
  maxSelectable,
}: Props) {
  const dispatch = useDispatch();
  const selectedIds = useSelector(selectSelectedMediaIds);
  const alert = useAlertDialog();
  // -------- Layout source (create vs. edit) ----------
  // Read both sources in a single selector to avoid conditional hooks
  const { isEditing, editLayoutIdRaw, createLayoutIdRaw } = useSelector(
    (s: RootState) => ({
      // If you already have a selector like selectIsEditing, use it here
      isEditing: (s as any).playlistInteractive?.isEditing === true,
      // layout id coming from edit flow (playlistData)
      editLayoutIdRaw: (s as any).playlistInteractive?.playlistData?.layoutId,
      // layout id coming from create flow (controlled field)
      createLayoutIdRaw: selectInteractiveLayoutId(s as any),
    })
  );

  // Normalize any string/number to a finite number or undefined
  const toNum = (v: unknown): number | undefined => {
    const n =
      typeof v === "string" ? Number(v) : typeof v === "number" ? v : undefined;
    return Number.isFinite(n) ? (n as number) : undefined;
  };

  // Prefer edit value when editing, otherwise use create value.
  // When edit isn't ready yet, we fall back to the create value to keep UX responsive.
  const layoutId = toNum(
    isEditing ? editLayoutIdRaw ?? createLayoutIdRaw : createLayoutIdRaw
  );

  const sliceCap = getCapForLayout(layoutId);

  // 👉 Use the passed max if provided; otherwise fall back to local cap (keeps backward compatibility)
  const cap =
    typeof maxSelectable === "number"
      ? maxSelectable
      : sliceCap ?? Number.POSITIVE_INFINITY;
  const layoutMissing = layoutId == null;

  // ---- pagination
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching, isError, refetch } = useGetMedia({
    page,
    perPage: PER_PAGE,
  });

  const media: MediaItem[] = data?.media ?? [];
  const items = useMemo(
    () => media.slice(0, PER_PAGE).filter((m) => m.type === "image" || !m.type),
    [media]
  );

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

  const showSkeleton = isPending || isFetching;

  const normalizeType = (t?: string): AllowedType | undefined =>
    t === "image" ? "image" : t === "video" ? "video" : undefined;

  const onToggle = (id: number, url: string, type?: AllowedType) => {
    if (type && type !== "image") {
      alert({
        title: "Images only",
        message: "Only images can be added. Videos are not supported here.",
        buttonText: "OK",
      });
      return;
    }

    const isSelected = selectedIds.includes(id);

    // Block adding if no layout chosen; allow deselect anytime
    if (!isSelected) {
      if (layoutMissing) {
        alert({
          title: "Layout required",
          message: "Please select a layout before adding media.",
          buttonText: "OK",
        });
        return;
      }

      // 👇 Unified cap: consider current total slides already in slider
      const totalNow = currentSlidesCount ?? 0; // uploads + library in slides state
      if (Number.isFinite(cap) && totalNow >= cap) {
        alert({
          title: "Selection limit reached",
          message: `You can select up to ${cap} items for this layout.`,
          buttonText: "Got it",
        });
        return;
      }
    }

    dispatch(toggleMediaSelection({ id, url, type }));
  };

  const totalDisplay = Number.isFinite(cap) ? cap : "∞";
  const totalNow = currentSlidesCount ?? 0;

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">Media</div>
        <div className="text-xs text-slate-600">
          Slides {totalNow} / {totalDisplay}
        </div>
      </div>

      {layoutMissing && (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-xs mb-2">
          Select a layout to enable adding media.
        </div>
      )}

      <div className="relative">
        <div
          className={cx(
            "flex gap-3 overflow-x-auto scroll-smooth whitespace-nowrap",
            "rounded-xl border border-slate-200/70 bg-white/70 py-2",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            layoutMissing && "pointer-events-none opacity-50"
          )}
          style={{
            height: CARD_SIZE + 16,
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
              const safeType = normalizeType(m.type); // should be "image" here

              // Disable add if we’re at cap; allow deselect
              const disableAdd =
                !selected &&
                (layoutMissing ||
                  (Number.isFinite(cap) && (currentSlidesCount ?? 0) >= cap));

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
                      "ring-2 ring-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
                    disableAdd && "opacity-60 cursor-not-allowed"
                  )}
                  style={{ width: CARD_SIZE, height: CARD_SIZE }}
                  title={safeType}
                  disabled={disableAdd}
                >
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
                "flex items-center justify-center"
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
