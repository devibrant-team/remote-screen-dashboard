import { useDispatch, useSelector } from "react-redux";
import { useInitGrid } from "../useInitGrid";
import { FourImageGridConfig } from "../../../../Config/GridConfig/DefaultGridConfig";
import { updateSlotInSlide } from "../../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { RootState } from "../../../../../store";
import { useAspectStyle } from "../../../../Hook/Playlist/RatioHook/RatiotoAspect";
import { useState } from "react";
import NormalMediaSelector from "../../MediaSelector/NormalMediaSelector";

const getScaleClass = (scale: string) => {
  switch (scale) {
    case "fit":
      return "w-full h-full object-contain";
    case "fill":
      return "w-full h-full object-cover";
    case "blur":
      return "relative z-10 max-h-full max-w-full object-contain";
    case "original":
      return "w-auto h-auto max-w-full max-h-full m-auto";
    default:
      return "w-full h-full object-contain";
  }
};

const FourGrid = () => {
  const dispatch = useDispatch();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);

  const openPickerFor = (slotIndex: number) => {
    setPickerSlotIndex(slotIndex);
    setPickerOpen(true);
  };
  const closePicker = () => {
    setPickerOpen(false);
    setPickerSlotIndex(null);
  };
  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  const ratio = useSelector((s: RootState) => s.playlist.selectedRatio);
  const style = useAspectStyle(ratio, {
    maxW: 1200,
    sideMargin: 48,
    topBottomMargin: 220,
  });

  const slide = useSelector((state: RootState) =>
    selectedSlideIndex !== null
      ? state.playlist.slides[selectedSlideIndex]
      : null
  );

  const templateSlots = FourImageGridConfig.slots;

  // ✅ Auto initialize if needed
  useInitGrid(
    slide,
    selectedSlideIndex,
    "fourGrid",
    templateSlots,
    FourImageGridConfig
  );

  const slots = slide?.slots || [];


  const handleScaleChange = (
    slotIndex: number,
    scale: "fit" | "fill" | "blur" | "original"
  ) => {
    if (selectedSlideIndex === null || !slide) return;

    const slot = slide.slots.find((s) => s.index === slotIndex);
    if (!slot || !slot.media || !slot.mediaType) return;

    if (!slot || !slot.media || !slot.mediaType || !slot.ImageFile) return;

    dispatch(
      updateSlotInSlide({
        slideIndex: selectedSlideIndex,
        slotIndex,
        media: slot.media,
        ImageFile: slot.ImageFile,
        mediaType: slot.mediaType,
        scale,
      })
    );
  };
  return (
    <div className="w-full mx-auto my-10 flex justify-center">
      {slots.length === 4 && (
        <div
          className="rounded-xl overflow-hidden bg-[#1e2530]  shadow w-full max-w-none"
          style={style} // from useAspectStyle(selectedRatio, ...)
        >
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            {slots.map((slot) => (
              <div key={slot.index} className="relative group overflow-hidden">
                {/* MEDIA */}
                {slot.media ? (
                  slot.mediaType === "video" ? (
                    <video
                      src={slot.media}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center">
                      {slot.scale === "blur" && (
                        <img
                          src={slot.media}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
                        />
                      )}
                      <img
                        src={slot.media}
                        className={`${getScaleClass(
                          slot.scale
                        )} transition-transform duration-200 group-hover:scale-105`}
                      />
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    className="w-full h-full bg-[#1e2530] flex items-center justify-center text-white cursor-pointer text-lg rounded-xl"
                    onClick={() => openPickerFor(slot.index)}
                  >
                    No media uploaded (click to choose)
                  </button>
                )}

                {/* CONTROLS */}
                {slot.media && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 z-10">
                    <select
                      value={slot.scale}
                      onChange={(e) =>
                        handleScaleChange(
                          slot.index,
                          e.target.value as "fit" | "fill" | "blur" | "original"
                        )
                      }
                      className="p-2 bg-white rounded text-sm font-bold shadow focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      <option value="fit">🖼️ Fit (Contain)</option>
                      <option value="fill">📱 Fill (Cover)</option>
                      <option value="blur">🌫️ Fit + Blur BG</option>
                      <option value="original">🧱 Original Size</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => openPickerFor(slot.index)}
                      className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Replace
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {pickerOpen &&
        pickerSlotIndex !== null &&
        selectedSlideIndex !== null && (
          <NormalMediaSelector
            open={pickerOpen}
            onClose={closePicker}
            slideIndex={selectedSlideIndex}
            slotIndex={pickerSlotIndex}
          />
        )}
    </div>
  );
};

export default FourGrid;
