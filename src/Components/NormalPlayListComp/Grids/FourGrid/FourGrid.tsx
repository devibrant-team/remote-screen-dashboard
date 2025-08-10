import { useDispatch, useSelector } from "react-redux";
import { useInitGrid } from "../useInitGrid";
import { FourImageGridConfig } from "../../../../Config/GridConfig/DefaultGridConfig";
import { updateSlotInSlide } from "../../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { RootState } from "../../../../../store";
import { useHandleMediaUpload } from "../../../../Hook/Playlist/PostNormalPlaylist";

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

  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );

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

  const handleMediaUpload = useHandleMediaUpload(selectedSlideIndex);

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
    <div className="w-full max-w-4xl mx-auto my-10">
      {slots.length === 4 && (
        <div className="grid grid-cols-2 grid-rows-2 w-full h-[50vh]  aspect-square max-w-[700px] mx-auto rounded-xl overflow-hidden">
          {slots.map((slot) => (
            <div
              key={slot.index}
              className="relative group bg-black overflow-hidden aspect-square w-full h-full"
            >
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
                <label className="w-full h-full flex items-center justify-center bg-[#1e2530] text-white cursor-pointer text-lg">
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

export default FourGrid;
