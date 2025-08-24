import { useDispatch, useSelector } from "react-redux";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import { updateSlotInSlide } from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { useInitGrid } from "./useInitGrid";
import { type RootState } from "../../../../store";
import WeatherWidget from "../Widgets/WeatherWidget";
import { useAspectStyle } from "../../../Hook/Playlist/RatioHook/RatiotoAspect";
import NormalMediaSelector from "../MediaSelector/NormalMediaSelector";
import OclockWidget from "../Widgets/OclockWidget";
import { useState } from "react";
import {
  selectRatioString,
} from "../../../Hook/Playlist/RatioHook/RatioSelectors";
import { useElementSize } from "../../../Hook/Playlist/RatioHook/useElementSize";
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

const DefaultGrid = () => {
  const dispatch = useDispatch();

  const {
    ref: wrapRef,
    height: containerH,
  } = useElementSize<HTMLDivElement>();

  const ratioStr = useSelector(selectRatioString); // "n:d" for your hook
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
  console.log("ratioStr", ratioStr);

const style = useAspectStyle(ratioStr, {
  containerH: containerH || 540,
  maxW: Number.POSITIVE_INFINITY, // or containerW if you also measure it
  sideMargin: 0,
  topBottomMargin: 0,
  fitBy: "height",
});

  const posToClass: Record<string, string> = {
    center: "items-center justify-center",
    "top-left": "items-start justify-start",
    "top-right": "items-start justify-end",
    "bottom-left": "items-end justify-start",
    "bottom-right": "items-end justify-end",
  };
  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  const slide = useSelector((state: RootState) =>
    selectedSlideIndex !== null
      ? state.playlist.slides[selectedSlideIndex]
      : null
  );

  const templateSlots = OneImageGridConfig.slots;
  useInitGrid(
    slide,
    selectedSlideIndex,
    "default",
    templateSlots,
    OneImageGridConfig
  );

  const handleScaleChange = (
    slotIndex: number,
    scale: "fit" | "fill" | "blur" | "original"
  ) => {
    if (selectedSlideIndex === null || !slide) return;

    const slot = slide.slots.find((s) => s.index === slotIndex);
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
   <div ref={wrapRef} className="w-full mx-auto my-10 flex justify-center" style={{ height: '56vh' }}>
      {slide?.slots.length === 1 && (
        <div
          className="rounded-xl overflow-hidden bg-white shadow"
          style={style}
        >
          {slide.slots.map((slot) => (
            <div
              key={slot.index}
              className="w-full h-full relative group rounded-xl overflow-hidden"
            >
              {/* Media Preview */}
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
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    )}
                    <img
                      src={slot.media}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
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
              {slot?.widget?.type === "weather" && (
                <div
                  className={`absolute inset-0 z-10 flex p-4 pointer-events-none ${
                    posToClass[
                      (slot.widget.position as keyof typeof posToClass) ||
                        "center"
                    ]
                  }`}
                >
                  <div className="pointer-events-auto">
                    <WeatherWidget city={slot.widget.city} />
                  </div>
                </div>
              )}
              {slot?.widget?.type === "clock" && (
                <div
                  className={`absolute inset-0 z-10 flex p-4 pointer-events-none ${
                    posToClass[
                      (slot.widget.position as keyof typeof posToClass) ||
                        "center"
                    ]
                  }`}
                >
                  <div className="pointer-events-auto">
                    <OclockWidget />
                  </div>
                </div>
              )}
              {/* Hover overlay */}
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

export default DefaultGrid;
