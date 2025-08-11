import { useDispatch, useSelector } from "react-redux";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import {
  updateSlideAtIndex,
  updateSlotInSlide,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { useInitGrid } from "./useInitGrid";
import { store, type RootState } from "../../../../store";
import WeatherWidget from "../Widgets/WeatherWidget";
import { useEffect } from "react";
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
  const DEFAULT_BG =
    "https://images.twinkl.co.uk/tw1n/image/private/t_630/u/ux/wolfgang-hasselmann-br-gllg7bs-unsplash-2_ver_1.jpg";
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
  return (
    <div className="w-full max-w-6xl mx-auto my-10">
      {slide?.slots.length === 1 && (
        <div className="w-full h-[50vh] relative rounded-xl overflow-hidden bg-gray-100">
          {slide.slots.map((slot) => (
            <div
              key={slot.index}
              className="w-full h-full relative group rounded-xl overflow-hidden"
            >
              {/* BACKGROUND MEDIA (image/video OR fallback) */}
              {slot.media ? (
                slot.mediaType === "video" ? (
                  <video
                    src={slot.media}
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full">
                    {slot.scale === "blur" && (
                      <img
                        src={slot.media}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
                      />
                    )}
                    <img
                      src={slot.media}
                      alt=""
                      className={`${getScaleClass(
                        slot.scale
                      )} absolute inset-0 transition-transform duration-200 group-hover:scale-105`}
                    />
                  </div>
                )
              ) : (
                // fallback background if no media
                <img
                  src={DEFAULT_BG}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* WIDGET OVERLAY (only if present) */}
              {slot?.widget?.type === "weather" && (
                <div
                  className={`absolute inset-0 z-10 flex p-4 ${
                    posToClass[
                      (slot.widget.position as keyof typeof posToClass) ||
                        "center"
                    ]
                  }`}
                >
                  <WeatherWidget city={slot.widget.city} />
                </div>
              )}

              {/* HOVER OVERLAY FOR BACKGROUND CONTROLS (shown even if widget exists) */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end justify-between p-4 transition-opacity duration-300 z-20">
                {/* Scale selector (applies to background image only) */}
                <div className="flex gap-2">
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
                    <option value="fit">Fit</option>
                    <option value="fill">Fill</option>
                    <option value="blur">Blur BG</option>
                    <option value="original">Original</option>
                  </select>
                </div>

                {/* Replace background */}
                <label className="bg-red-500 text-white px-4 py-1 rounded cursor-pointer text-sm hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400">
                  Replace Background
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

              {/* EMPTY STATE (no media and no widget) — allow upload */}
              {!slot.media && !slot.widget && (
                <label className="absolute inset-0 flex items-center justify-center text-white bg-[#1e2530] cursor-pointer text-lg">
                  Upload Media
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DefaultGrid;
