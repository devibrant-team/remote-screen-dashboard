import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import {
  addSlide,
  setSelectedSlideIndex,
  updateSlideAtIndex,
  reorderSlide,
  removeSlideAtIndex,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import { Plus } from "lucide-react";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  MeasuringStrategy,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { DragOverlay } from "@dnd-kit/core";

import SortableSlide from "../SortableSlide";


type SlideType = any; // replace with your NormalPlaylistState type if available

const NormalSlider: React.FC = () => {
  const dispatch = useDispatch();

  const slides = useSelector((s: RootState) => s.playlist.slides);

  const selected = useSelector((s: RootState) => s.playlist.selectedSlideIndex);

  // Use STABLE IDs from the slide objects (not indices)
  const items = useMemo<string[]>(
    () => slides.map((s: SlideType) => String(s.id)),
    [slides]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleAddSlide = useCallback(() => {
    const defaultSlide: SlideType = {
      id: crypto.randomUUID(), // stable id
      duration: 10,
      selectedGrid: "default",
      slots: OneImageGridConfig.slots.map((slot: any) => ({
        ...slot,
        media: null as string | null,
        mediaType: undefined as "image" | "video" | undefined,
      })),
    };
    const newIndex = slides.length;
    dispatch(addSlide(defaultSlide));
    dispatch(setSelectedSlideIndex(newIndex));
  }, [dispatch, slides.length]);

  const handleDurationChange = useCallback(
    (index: number, newDuration: number) => {
      const updated = { ...slides[index], duration: newDuration };
      dispatch(updateSlideAtIndex({ index, updatedSlide: updated }));
    },
    [dispatch, slides]
  );

  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const from = slides.findIndex(
        (s: SlideType) => String(s.id) === String(active.id)
      );
      const to = slides.findIndex(
        (s: SlideType) => String(s.id) === String(over.id)
      );

      if (from !== -1 && to !== -1 && from !== to) {
        dispatch(reorderSlide({ from, to }));
        dispatch(setSelectedSlideIndex(to));
      }
    },
    [dispatch, slides]
  );

  // Initialize selection on first slide
  useEffect(() => {
    if (slides.length > 0 && selected === null) {
      dispatch(setSelectedSlideIndex(0));
    }
  }, [slides.length, selected, dispatch]);
  const handleRemoveByIndex = useCallback(
    (idx: number) => {
      dispatch(removeSlideAtIndex(idx));

      // keep selection valid
      if (selected !== null) {
        if (idx === selected) {
          // deleted the selected slide → move selection left (or clear if list is now empty)
          dispatch(
            setSelectedSlideIndex(
              slides.length > 1 ? Math.max(0, selected - 1) : null
            )
          );
        } else if (idx < selected) {
          // a slide before the selected one was removed → shift selection left by 1
          dispatch(setSelectedSlideIndex(selected - 1));
        }
      }
    },
    [dispatch, selected, slides.length]
  );

  // Memoized render of one card to avoid inline lambdas in map body
  const renderSlide = useCallback(
    (slide: SlideType, index: number) => (
      <SortableSlide
        key={slide.id}
        id={String(slide.id)}
        index={index}
        slide={slide}
        isSelected={selected === index}
        onSelect={() => dispatch(setSelectedSlideIndex(index))}
        onDurationChange={(v) => handleDurationChange(index, v)}
        onRemove={() => handleRemoveByIndex(index)}
      />
    ),
    [dispatch, handleDurationChange, handleRemoveByIndex, selected]
  );

  // Lightweight overlay content while dragging (no inputs/heavy styles)
  const activeSlide = useMemo(
    () => slides.find((s: SlideType) => String(s.id) === activeId),
    [slides, activeId]
  );

  return (
    <section className="p-4 md:p-6 max-h-screen">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">
          Normal Slider
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600">
            Total slides: <b>{slides.length}</b>
          </span>

          <button
            onClick={handleAddSlide}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium shadow-sm hover:shadow transition bg-white hover:bg-gray-50 active:scale-[0.99]"
            aria-label="Add slide"
          >
            <Plus size={16} color="red" />
            Add slide
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{
          // cheaper measuring to avoid layout thrash
          droppable: { strategy: MeasuringStrategy.WhileDragging },
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {slides.map(renderSlide)}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSlide ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-2 w-[220px]">
              <div className="w-full aspect-[7/5] overflow-hidden rounded-xl bg-white">
                {activeSlide?.slots?.[0]?.media ? (
                  activeSlide.slots[0].mediaType === "video" ? (
                    <div className="flex items-center justify-center w-full h-full text-xs font-medium">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-900/80 px-2 py-1 text-white">
                        🎥 Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={activeSlide.slots[0].media as string}
                      alt="drag"
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
              <p className="text-center text-xs mt-2">Moving…</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
};

export default NormalSlider;
