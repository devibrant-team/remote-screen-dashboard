// hooks/useInitGrid.ts
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateSlideGrid, updateSlideSlots } from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { GridLayoutConfig } from "../../../Config/GridConfig/DefaultGridConfig";
export const useInitGrid = (
  slide: any,
  selectedSlideIndex: number | null,
  selectedGridKey: string,
  templateSlots: any[],
  gridConfig: GridLayoutConfig
) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!slide || selectedSlideIndex === null) return;

    const needsInit =
      slide.selectedGrid !== selectedGridKey ||
      slide.slots.length !== templateSlots.length ||
      slide.slots.every((s: any) => !s.media && !s.mediaType);

    if (needsInit) {
      const preparedSlots = templateSlots.map((slot) => ({
        ...slot,
        media: null,
        mediaType: undefined,
      }));

      dispatch(updateSlideSlots({ index: selectedSlideIndex, slots: preparedSlots }));
      dispatch(updateSlideGrid({ index: selectedSlideIndex, selectedGrid: selectedGridKey ,  grid_style: gridConfig.id, }));
    }
  }, [slide?.selectedGrid, slide?.slots?.length, selectedSlideIndex , gridConfig]);
};
