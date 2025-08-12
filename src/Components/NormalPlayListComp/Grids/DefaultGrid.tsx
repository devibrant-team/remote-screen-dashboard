import { useDispatch, useSelector } from "react-redux";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import {
  updateSlideAtIndex,
  updateSlotInSlide,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { useInitGrid } from "./useInitGrid";
import { store, type RootState } from "../../../../store";
import WeatherWidget from "../Widgets/WeatherWidget";
import { useAspectStyle } from "../../../Hook/Playlist/RatioHook/RatiotoAspect";

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
  const ratio = useSelector((s: RootState) => s.playlist.selectedRatio);
  const style = useAspectStyle(ratio, {
    maxW: 1200,
    sideMargin: 48,
    topBottomMargin: 220,
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

  const handleMediaUpload = (slotIndex: number, file: File) => {
    if (selectedSlideIndex === null) return;

    const mediaUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video") ? "video" : "image";

    if (mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = mediaUrl;

      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);

        // 1. Update slot
        dispatch(
          updateSlotInSlide({
            slideIndex: selectedSlideIndex,
            slotIndex,
            media: mediaUrl,
            ImageFile: file,
            mediaType,
          })
        );

        // 2. Get updated slide from store BEFORE updating again
        const latestSlide = {
          ...store.getState().playlist.slides[selectedSlideIndex], // get latest
          duration,
        };

        dispatch(
          updateSlideAtIndex({
            index: selectedSlideIndex,
            updatedSlide: latestSlide,
          })
        );
      };
    } else {
      dispatch(
        updateSlotInSlide({
          slideIndex: selectedSlideIndex,
          slotIndex,
          media: mediaUrl,
          ImageFile: file,
          mediaType,
        })
      );

      // Same fix for image: re-pull slide
      const latestSlide = {
        ...store.getState().playlist.slides[selectedSlideIndex],
        duration: 10,
      };

      dispatch(
        updateSlideAtIndex({
          index: selectedSlideIndex,
          updatedSlide: latestSlide,
        })
      );
    }
  };

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
  //flex items-center justify-center rounded-xl overflow-hidden
  return (
    <div className="w-full mx-auto my-10 flex justify-center">
      {slide?.slots.length === 1 && (
        <div
          className="rounded-xl overflow-hidden bg-white shadow "
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
                <label className="w-full h-full bg-[#1e2530] flex items-center justify-center text-white cursor-pointer text-lg rounded-xl">
                  No media uploaded
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleMediaUpload(slot.index, e.target.files[0])
                    }
                    className="hidden"
                  />
                </label>
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
                  <label className="bg-red-500 text-white px-4 py-1 rounded cursor-pointer text-sm hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400">
                    Replace
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleMediaUpload(slot.index, e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DefaultGrid;
