import { useDispatch, useSelector } from "react-redux";
import { useInitGrid } from "../useInitGrid"; // ✅ custom hook
import { TwoByTwoColConfig } from "../../../../Config/GridConfig/DefaultGridConfig";
import { updateSlotInSlide } from "../../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { RootState } from "../../../../../store";
import { useAspectStyle } from "../../../../Hook/Playlist/RatioHook/RatiotoAspect";
import { useState } from "react";
import NormalMediaSelector from "../../MediaSelector/NormalMediaSelector";
import { selectRatioString } from "../../../../Hook/Playlist/RatioHook/RatioSelectors";
import { useElementSize } from "../../../../Hook/Playlist/RatioHook/useElementSize";

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

const TwobyTwoGridCol = () => {
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
  const { ref: wrapRef, height: containerH } = useElementSize<HTMLDivElement>();

  const ratioStr = useSelector(selectRatioString); // "n:d" for your hook
  const style = useAspectStyle(ratioStr, {
    containerH: containerH || 540,
    maxW: Number.POSITIVE_INFINITY, // or containerW if you also measure it
    sideMargin: 0,
    topBottomMargin: 0,
    fitBy: "height",
  });

  const slide = useSelector((state: RootState) =>
    selectedSlideIndex !== null
      ? state.playlist.slides[selectedSlideIndex]
      : null
  );

  const templateSlots = TwoByTwoColConfig.slots;

  // ✅ auto init grid if needed
  useInitGrid(
    slide,
    selectedSlideIndex,
    "twobyTwoCol",
    templateSlots,
    TwoByTwoColConfig
  );

  const slots = slide?.slots || [];


  const handleScaleChange = (
  slotIndex: number,
  scale: "fit" | "fill" | "blur" | "original"
) => {
  if (selectedSlideIndex === null || !slide) return;

  const slot = slide.slots.find((s) => s.index === slotIndex);
  if (!slot || !slot.media || !slot.mediaType) return;

  dispatch(
    updateSlotInSlide({
      slideIndex: selectedSlideIndex,
      slotIndex,
      media: slot.media,
      mediaType: slot.mediaType,
      ImageFile: slot.ImageFile ?? null,   // ✅ allow null
      scale,                                // ✅ the thing we change
    })
  );
};

  return (
    <div
      ref={wrapRef}
      className="w-full mx-auto my-10 flex justify-center"
      style={{ height: "56vh" }}
    >
      {slots.length > 0 && (
        <div
          className="rounded-xl overflow-hidden bg-[#1e2530]  shadow"
          style={style}
        >
          <div className="flex flex-col w-full h-full">
            {slots.slice(0, 2).map((slot) => (
              <div
                key={slot.index}
                className="flex-1 relative group overflow-hidden"
              >
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

export default TwobyTwoGridCol;
