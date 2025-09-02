// components/WidgetModels/WidgetModels.tsx
import { Clock, Cloud } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { updateSlotMedia } from "../../Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import { updateSlotWidgetInSlide } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { SlotWidget } from "../../Config/GridConfig/DefaultGridConfig";

type WidgetModelsProps = { onClose: () => void };

const WidgetModels: React.FC<WidgetModelsProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  const slide = useSelector((state: RootState) =>
    selectedSlideIndex !== null ? state.playlist.slides[selectedSlideIndex] : null
  );
const city = useSelector((s:RootState)=>s.playlist.selectedCity)
  const ensureSlotMedia = (slotIndex: number) => {
    const slot = slide?.slots[slotIndex];
    if (!slot?.media) {
      dispatch(
        updateSlotMedia({
          index: slotIndex,
          media: null,
          mediaType: "image",
        })
      );
    }
  };

  const setSlotWidget = (slotIndex: number, widget: SlotWidget) => {
    if (selectedSlideIndex === null || !slide) {
      alert("Please select/create a slide first.");
      return;
    }
    ensureSlotMedia(slotIndex);
    dispatch(
      updateSlotWidgetInSlide({
        slideIndex: selectedSlideIndex,
        slotIndex,
        widget,
      })
    );
    onClose();
  };

  const handleAddClockWidget = () => {
    const slotIndex = 0; // choose target slot; make dynamic if needed
    setSlotWidget(slotIndex, {
      type: "clock",
      timezone: "Asia/Riyadh", // fixed to Jeddah
      city: city,
      showSeconds: true,
      twentyFourHour: true,
      position: "center",
    });
  };

  const handleAddWeatherWidget = () => {
    const slotIndex = 0;
    setSlotWidget(slotIndex, {
      type: "weather",
       city: city, // fixed for now (or "Jeddah" if you prefer)
      position: "center",
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleAddClockWidget}
        className="flex items-center gap-3 p-4 w-full rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition cursor-pointer"
      >
        <Clock size={20} className="text-[var(--mainred)]" />
        <div className="flex flex-col items-start">
          <h1 className="font-bold text-lg">Clock Widget</h1>
          <span className="font-semibold text-gray-400 text-sm">
            Display current time
          </span>
        </div>
      </button>

      <button
        onClick={handleAddWeatherWidget}
        className="flex items-center gap-3 p-4 w-full rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition cursor-pointer"
      >
        <Cloud size={20} className="text-[var(--mainred)]" />
        <div className="flex flex-col items-start">
          <h1 className="font-bold text-lg">Weather Widget</h1>
          <span className="font-semibold text-gray-400 text-sm">
            Show weather information
          </span>
        </div>
      </button>
    </div>
  );
};

export default WidgetModels;
