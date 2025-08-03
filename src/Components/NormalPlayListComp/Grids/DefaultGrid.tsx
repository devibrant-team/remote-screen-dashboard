// components/DefaultGrid.tsx

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setSlots,
  updateSlotImage,
  updateSlotScale,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { gridTemplates } from "../../../Config/GridConfig/DefaultGridConfig";
import type { RootState } from "../../../../store";

const DefaultGrid = () => {
  const dispatch = useDispatch();

  const defaultTemplate = useMemo(() => {
    return gridTemplates.find((t) => t.displayName === "Normal");
  }, []);

  const slots = useSelector((state: RootState) => state.normalplaylist.slots); // ✅ correct lowercase slice name
console.log("Current slots from Redux:", slots);
  useEffect(() => {
    if (defaultTemplate) {
      const preparedSlots = defaultTemplate.slots.map((slot) => ({
        ...slot,
        image: null,
      }));
      console.log("Setting initial slots:", preparedSlots); // ✅ log here
      dispatch(setSlots(preparedSlots));
    }
  }, [defaultTemplate, dispatch]);

  const handleImageUpload = (index: number, file: File) => {
    const imageUrl = URL.createObjectURL(file);
     console.log(`Uploading image for slot ${index}:`, imageUrl);
    dispatch(updateSlotImage({ index, image: imageUrl }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-10 grid gap-6">
      {slots.map((slot) => (
        <div key={slot.index} className="w-full space-y-3">
          <h3 className="text-lg font-semibold text-white">{slot.name}</h3>

          {slot.image ? (
            <div className="relative">
              <img
                src={slot.image}
                alt={slot.name}
                className={`w-full max-h-[80vh] rounded-xl ${
                  slot.scale === "fit"
                    ? "object-contain"
                    : slot.scale === "fill"
                    ? "object-cover"
                    : slot.scale === "stretch"
                    ? "object-fill"
                    : "object-contain"
                }`}
              />
            </div>
          ) : (
            <label className="w-full min-h-[60vh] bg-[#1e2530] rounded-xl flex items-center justify-center text-white cursor-pointer text-lg">
              No media selected
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleImageUpload(slot.index, e.target.files[0])
                }
                className="hidden"
              />
            </label>
          )}

          <select
            className="mt-2 p-2 border rounded-md"
            value={slot.scale}
            onChange={(e) =>
              dispatch(
                updateSlotScale({
                  index: slot.index,
                  scale: e.target.value as
                    | "fit"
                    | "fill"
                    | "stretch"
                    | "blur"
                    | "original"
                })
              )
            }
          >
            <option value="original">Original Scale</option>
            <option value="fit">Scale to fit</option>
            <option value="stretch">Stretch to fit</option>
            <option value="blur">Fit with Blur background</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default DefaultGrid;
