import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Clock, Move, Trash2 } from "lucide-react";

type SlideType = any; // replace with your NormalPlaylistState

type Props = {
  id: string;
  index: number;
  slide: SlideType;
  isSelected: boolean;
  onSelect: () => void;
  onDurationChange: (v: number) => void;
  onRemove?: () => void;
};

const SortableSlide: React.FC<Props> = ({
  id,
  index,
  slide,
  isSelected,
  onSelect,
  onDurationChange,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    // keep transitions lightweight and GPU-friendly
    transition: transform ? "transform 280ms ease" : undefined,
    willChange: transform ? "transform" : undefined,
    contain: "content", // isolate layout/paint for perf
    backfaceVisibility: "hidden",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`group relative cursor-pointer rounded-2xl border p-2 bg-white transition-[box-shadow,border-color] duration-150
        ${
          isSelected
            ? "border-red-500 ring-2 ring-red-200 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
        ${isDragging ? "shadow-sm" : ""}`}
    >
      <button
        type="button"
        aria-label="Remove slide"
        title="Remove slide"
        className="absolute top-2 right-2 z-10
             opacity-0 group-hover:opacity-100 transition-opacity
             rounded-full p-1 border border-gray-200 bg-white shadow
             hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
        onClick={(e) => {
          e.stopPropagation(); 
          e.preventDefault();
          onRemove?.();
        }}
        onPointerDown={(e) => {
    
          e.stopPropagation();
        }}
      >
        <Trash2 size={16} className="hover:text-white"/>
      </button>
      {/* Preview */}
      <div className="w-full aspect-[7/5] overflow-hidden rounded-xl bg-white">
        {slide?.slots?.[0]?.media ? (
          slide.slots[0].mediaType === "video" ? (
            <div className="flex items-center justify-center bg-red-400 w-full h-full text-xs font-medium">
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-900/80 px-2 py-1 text-white">
                🎥 Video
              </span>
            </div>
          ) : (
            <img
              src={slide.slots[0].media as string}
              alt={`Slide ${index + 1}`}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="object-contain w-full h-full"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No media
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-center text-sm mt-2 font-medium">Slide {index + 1}</p>

      {/* Duration */}
      <div className="mt-2">
        <label className="mb-1 flex items-center justify-center gap-1 text-[11px] text-gray-500">
          <Clock size={12} /> Duration (sec)
        </label>
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={slide.duration}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
        />
      </div>

      {/* Bottom-right drag handle (press/hold to reorder) */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Hold & drag to reorder"
        aria-label="Hold and drag to reorder"
        className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/90 hover:bg-gray-50 shadow-sm"
      >
        <Move size={16} />
      </button>
    </div>
  );
};

// Prevent re-renders unless meaningful props changed
export default React.memo(SortableSlide, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.index === next.index &&
    prev.slide.duration === next.slide.duration &&
    prev.slide?.slots?.[0]?.media === next.slide?.slots?.[0]?.media &&
    prev.slide?.slots?.[0]?.mediaType === next.slide?.slots?.[0]?.mediaType
  );
});
