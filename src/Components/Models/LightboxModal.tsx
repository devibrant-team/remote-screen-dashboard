import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeLightbox, nextItem, prevItem } from "../../Redux/Media/MediaLibrarySlice";
import type { RootState } from "../../../store";

const FALLBACK_IMG = "https://dummyimage.com/600x400/eeeeee/9aa0a6.png&text=Media";

export const Lightbox: React.FC = () => {
  const dispatch = useDispatch();
  const { lightboxOpen, selectedIndex, items } = useSelector(
    (s: RootState) => s.mediaLibrary
  );

  const item = selectedIndex != null ? items[selectedIndex] : undefined;

  // Always call hooks; gate the effect body with lightboxOpen
  useEffect(() => {
    if (!lightboxOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(closeLightbox());
      if (e.key === "ArrowLeft") dispatch(prevItem());
      if (e.key === "ArrowRight") dispatch(nextItem());
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, dispatch]);

  // Lock scroll only while open
  useEffect(() => {
    if (!lightboxOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  // After hooks, you can return null safely
  if (!lightboxOpen || selectedIndex == null || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="absolute inset-0" onClick={() => dispatch(closeLightbox())} />

      <div className="relative z-[101] mx-auto max-h-[85vh] max-w-[92vw]">
        <div className="flex items-center justify-center">
          {item.type === "video" ? (
            <video
              src={item.media}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl bg-black"
              controls
              autoPlay
            />
          ) : (
            <img
              src={item.media || FALLBACK_IMG}
              alt="Preview"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => dispatch(closeLightbox())}
          className="absolute -right-3 -top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow ring-1 ring-black/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(prevItem());
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
              dispatch(nextItem());
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
