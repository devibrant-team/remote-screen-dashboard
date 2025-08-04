import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setSlots,
  updateSlotMedia,
  updateSlotScale,
} from "../../../Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import type { RootState } from "../../../../store";
import DurationInput from "./Inputs/DurationInput";

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
  const OneTemplate = useMemo(() => OneImageGridConfig, []);
  const slots = useSelector((state: RootState) => state.normalplaylist.slots);
  // const duration = useSelector(
  //   (state: RootState) => state.normalplaylist.duration
  // );
  const normalSlide = useSelector((state: RootState) => state.normalplaylist);

useEffect(() => {
  console.log("[NormalPlaylist State]", normalSlide);
}, [normalSlide]);

  useEffect(() => {
    if (OneTemplate) {
      const preparedSlots = OneTemplate.slots.map((slot) => ({
        ...slot,
        media: null,
        mediaType: undefined,
      }));
      dispatch(setSlots(preparedSlots));
    }
  }, [OneTemplate, dispatch]);

  const handleMediaUpload = (index: number, file: File) => {
    const mediaUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video") ? "video" : "image";
    dispatch(updateSlotMedia({ index, media: mediaUrl, mediaType }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-10">
      <DurationInput/>
      {slots.length === 1 && (
        <div className="w-full h-[60vh] flex items-center justify-center rounded-xl overflow-hidden bg-gray-100">
          {slots.map((slot) => (
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
                      alt={slot.name}
                      className={`${getScaleClass(
                        slot.scale
                      )} transition-transform duration-200 group-hover:scale-105`}
                    />
                  </div>
                )
              ) : (
                <label className="w-full h-full bg-[#1e2530] flex items-center justify-center text-white cursor-pointer text-lg rounded-xl">
                  No media selected
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

              {/* Hover overlay */}
              {slot.media && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 z-10">
                  <select
                    value={slot.scale}
                    onChange={(e) =>
                      dispatch(
                        updateSlotScale({
                          index: slot.index,
                          scale: e.target.value as
                            | "fit"
                            | "fill"
                            | "blur"
                            | "original",
                        })
                      )
                    }
                    className="p-2 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
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
