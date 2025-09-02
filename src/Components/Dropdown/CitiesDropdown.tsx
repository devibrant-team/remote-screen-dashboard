// src/Components/Dropdown/SaudiCityDropdown.tsx
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useSaudiCities } from "../../ReactQuery/Cities/GetCities";
import {
  setSelectedCity,
  updateSlotWidgetInSlide,
} from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { SlotWidget } from "../../Config/GridConfig/DefaultGridConfig";

const SaudiCityDropdown: React.FC = () => {
  const dispatch = useDispatch();
  const { data: cities, isLoading, isError, error } = useSaudiCities();

  // playlist state
  const { selectedSlideIndex, slides, selectedCity } = useSelector(
    (s: RootState) => s.playlist
  );
  const selectedSlide =
    selectedSlideIndex !== null ? slides[selectedSlideIndex] : null;

  // first slot with a widget (if any)
  const firstWidgetSlotIndex =
    selectedSlide?.slots.findIndex((s) => !!s.widget) ?? -1;

  const currentWidget: SlotWidget | null =
    firstWidgetSlotIndex >= 0
      ? selectedSlide!.slots[firstWidgetSlotIndex].widget ?? null
      : null;

  const isWeather = currentWidget?.type === "weather";

  // use widget city if a weather widget exists, otherwise fallback to global selectedCity
  const value = isWeather
    ? (currentWidget?.city ?? selectedCity ?? "")
    : (selectedCity ?? "");

  // normalize API response to an array of strings
  const cityList = useMemo<string[]>(
    () =>
      Array.isArray(cities)
        ? cities.slice().sort((a, b) => a.localeCompare(b))
        : Object.values(cities ?? {})
            .map(String)
            .sort((a, b) => a.localeCompare(b)),
    [cities]
  );

  const handleCityChange = (city: string) => {
    // always remember the user's choice globally
    dispatch(setSelectedCity(city));

    // if a weather widget exists, update that widget too
    if (
      isWeather &&
      selectedSlideIndex !== null &&
      firstWidgetSlotIndex >= 0 &&
      currentWidget
    ) {
      dispatch(
        updateSlotWidgetInSlide({
          slideIndex: selectedSlideIndex,
          slotIndex: firstWidgetSlotIndex,
          widget: { ...currentWidget, city },
        })
      );
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-500 lg:text-base font-semibold">
        City
      </label>

      <select
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mainred)]"
        value={value}
        onChange={(e) => handleCityChange(e.target.value)}
        // keep enabled; only disable if truly loading error is critical
        disabled={isLoading || isError}
      >
        <option value="" disabled>
          {isLoading
            ? "Loading cities…"
            : isError
            ? "Failed to load cities"
            : "Select a city"}
        </option>

        {cityList.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {isError && (
        <p className="text-xs text-red-600">
          {(error as Error)?.message || "Could not load cities."}
        </p>
      )}
    </div>
  );
};

export default SaudiCityDropdown;
