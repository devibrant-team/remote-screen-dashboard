// components/WidgetModels/WidgetModels.tsx
import { Clock, Cloud } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { updateSlotMedia } from "../../Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import { updateSlotWidgetInSlide } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { SlotWidget } from "../../Config/GridConfig/DefaultGridConfig";
import SaudiCityDropdown from "../Dropdown/CitiesDropdown";
import { useAlertDialog } from "@/AlertDialogContext";

type WidgetModelsProps = { onClose: () => void; selectedCity?: string };

const WidgetModels: React.FC<WidgetModelsProps> = ({
  onClose,
  selectedCity,
}) => {
  const dispatch = useDispatch();

  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  const slide = useSelector((state: RootState) =>
    selectedSlideIndex !== null
      ? state.playlist.slides[selectedSlideIndex]
      : null
  );
  const alert = useAlertDialog();

  // city from global store
  const cityFromStore = useSelector((s: RootState) => s.playlist.selectedCity);

  // effective city: prefer prop if passed, otherwise store
  const effectiveCity = (selectedCity ?? cityFromStore ?? "").trim();

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
      alert({
        title: "No slide selected",
        message: "Please select or create a slide first.",
        buttonText: "OK",
      });
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
    if (!effectiveCity) {
      alert({
        title: "City required",
        message: "Please choose a city first.",
        buttonText: "OK",
      });
      return;
    }
    const slotIndex = 0;
    setSlotWidget(slotIndex, {
      type: "clock",
      timezone: "Asia/Riyadh",
      city: effectiveCity,
      showSeconds: true,
      twentyFourHour: true,
      position: "center",
    });
  };

  const handleAddWeatherWidget = () => {
    if (!effectiveCity) {
      alert({
        title: "City required",
        message: "Please choose a city first.",
        buttonText: "OK",
      });
      return;
    }
    const slotIndex = 0;
    setSlotWidget(slotIndex, {
      type: "weather",
      city: effectiveCity,
      position: "center",
    });
  };

  const isCitySelected = Boolean(effectiveCity);

  return (
    <div className="space-y-4">
      {/* City selector inside modal */}
      <section className="rounded-xl border border-gray-200 bg-white p-3">
        <SaudiCityDropdown />
        {!isCitySelected && (
          <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
            Please choose a city to enable widgets.
          </p>
        )}
      </section>

      <button
        onClick={handleAddClockWidget}
        disabled={!isCitySelected}
        className={`flex items-center gap-3 p-4 w-full rounded-lg border shadow-sm transition cursor-pointer
          ${
            isCitySelected
              ? "border-gray-200 hover:bg-gray-50 bg-white"
              : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
      >
        <Clock
          size={20}
          className={isCitySelected ? "text-[var(--mainred)]" : "text-gray-400"}
        />
        <div className="flex flex-col items-start">
          <h1 className="font-bold text-lg">Clock Widget</h1>
          <span className="font-semibold text-gray-400 text-sm">
            Display current time
          </span>
        </div>
      </button>

      <button
        onClick={handleAddWeatherWidget}
        disabled={!isCitySelected}
        className={`flex items-center gap-3 p-4 w-full rounded-lg border shadow-sm transition cursor-pointer
          ${
            isCitySelected
              ? "border-gray-200 hover:bg-gray-50 bg-white"
              : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
      >
        <Cloud
          size={20}
          className={isCitySelected ? "text-[var(--mainred)]" : "text-gray-400"}
        />
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
