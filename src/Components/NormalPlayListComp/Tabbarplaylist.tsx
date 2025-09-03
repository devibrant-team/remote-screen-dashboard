import { useEffect, useState } from "react";
import { Layers, Grid2X2, ArrowBigLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setPlaylistName,
  clearPlaylist,
} from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import GridSelector from "./GridSelector/GridSelector";
import { savePlaylistToDatabase } from "../../Hook/Playlist/PostNormalPlaylist";
import type { RootState } from "../../../store";
import { useNavigate } from "react-router-dom";
import type { WidgetPosition } from "../../Config/GridConfig/DefaultGridConfig";
import { updateSlotWidgetInSlide } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import BaseModal from "../Models/BaseModal";
import WidgetModels from "../Models/WidgetModels";
import RatioDropdown from "../Dropdown/RatioDropdown";
import { useQueryClient } from "@tanstack/react-query";
import SaudiCityDropdown from "../Dropdown/CitiesDropdown";

const Tabbarplaylist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const playlistName = useSelector((state: RootState) => state.playlist.name);
  const [modalOpen, setModalOpen] = useState(false);
  const [showGridSelector, setShowGridSelector] = useState(false);
  const playlist = useSelector((state: RootState) => state.playlist);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [, setSaveMessage] = useState("");
  const [, setError] = useState("");
  const isEdit = useSelector((s: RootState) => s.playlist.isEdit);
  const playlistId = useSelector((s: RootState) => s.playlist.id);
  console.log("ID", playlistId);
  const handleSavePlaylist = async () => {
    if (!playlist.name || playlist.name.trim() === "") {
      window.alert("❌ Please enter a playlist name.");
      return;
    }
    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      await savePlaylistToDatabase(playlist, isEdit);
      setSaveMessage("✅ Playlist saved successfully!");
      window.alert("✅ Playlist saved successfully!");
      dispatch(setPlaylistName(""));
      dispatch(clearPlaylist());
      queryClient.invalidateQueries({ queryKey: ["normalplaylist"] });
      navigate("/mediacontent");
    } catch (err: any) {
      console.error("❌ Save failed", err);
      setError("❌ Failed to save playlist.");
      window.alert("❌ Failed to save playlist.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    dispatch(clearPlaylist());
    navigate("/mediacontent");
  };

  // which slide is active
  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  const selectedSlide =
    selectedSlideIndex !== null ? playlist.slides[selectedSlideIndex] : null;

  // find first slot that has a widget
  const firstWidgetSlotIndex =
    selectedSlide?.slots.findIndex((s) => !!s.widget) ?? -1;

  const currentWidget =
    firstWidgetSlotIndex >= 0
      ? selectedSlide!.slots[firstWidgetSlotIndex].widget
      : null;

  const handleWidgetPositionChange = (pos: WidgetPosition) => {
    if (
      selectedSlideIndex === null ||
      firstWidgetSlotIndex < 0 ||
      !currentWidget
    )
      return;

    // write back the widget with updated position
    dispatch(
      updateSlotWidgetInSlide({
        slideIndex: selectedSlideIndex,
        slotIndex: firstWidgetSlotIndex,
        widget: { ...currentWidget, position: pos },
      })
    );
  };

  useEffect(() => {
    if (
      selectedSlideIndex === null ||
      firstWidgetSlotIndex < 0 ||
      !currentWidget ||
      !("city" in currentWidget)
    ) {
      return;
    }

    const desiredCity = playlist.selectedCity || "";
    if (currentWidget.city === desiredCity) return;

    dispatch(
      updateSlotWidgetInSlide({
        slideIndex: selectedSlideIndex,
        slotIndex: firstWidgetSlotIndex,
        widget: { ...currentWidget, city: desiredCity },
      })
    );
    // Keep deps *minimal* to avoid re-running for new widget object identities.
  }, [playlist.selectedCity, selectedSlideIndex]);

  return (
    <>
      {showGridSelector && (
        <GridSelector onClose={() => setShowGridSelector(false)} />
      )}

      {/* Sidebar: full height on all screens; width changes at lg */}
      <aside
        className="
          w-full lg:w-80
          lg:h-[100svh]                 /* modern mobile browsers */
          h-dvh                                     /* fallback */
          bg-[var(--white)] text-[var(--black)]
          border-r border-gray-200 shadow-sm
          flex flex-col overflow-hidden
        "
      >
        <div className="sticky top-0 z-10 flex justify-between items-center gap-3 border-b border-gray-200 bg-[var(--white)] px-4 py-3 lg:px-6 lg:py-4">
          <button
            onClick={handleCancel}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-xs hover:bg-neutral-50"
          >
            <ArrowBigLeft size={18} />
            <span>Back</span>
          </button>

          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
            Playlist Editor
          </span>
        </div>

        {/* Single scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Playlist name */}
          <section className="space-y-2">
            <label
              htmlFor="playlist-name"
              className="text-sm text-gray-500 lg:text-base font-semibold"
            >
              Name
            </label>
            <input
              id="playlist-name"
              defaultValue={playlistName}
              onChange={(e) => dispatch(setPlaylistName(e.target.value))}
              type="text"
              required
              placeholder="Enter playlist name"
              className="w-full mt-3 p-2 rounded-md text-gray-600 font-semibold border border-gray-300 focus:ring-2 focus:ring-[var(--mainred)] focus:outline-none"
            />
          </section>

          {/* Media Controls */}
          <section className="space-y-3">
            <h4 className="text-sm text-gray-500 lg:text-base font-semibold">
              Media
            </h4>

            <button
              onClick={() => setShowGridSelector(true)}
              className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition"
            >
              <Grid2X2 size={18} />
              <span>Apply Collage</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              disabled={!playlist.selectedCity?.trim()}
              className={`
      flex items-center justify-center gap-2 w-full font-semibold py-2 px-4 rounded-md transition
      ${
        !playlist.selectedCity?.trim()
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-[var(--mainred)] text-white hover:bg-red-600"
      }
    `}
            >
              <Layers size={18} />
              <span>Add Widget</span>
            </button>

            {!playlist.selectedCity?.trim() && (
              <p className="text-xs text-gray-500 text-center">
                Select a city first to enable widgets.
              </p>
            )}
          </section>

          {/* Ratio */}
          <section className="space-y-2 w-full">
            <h4 className="text-sm text-gray-500 lg:text-base font-semibold">
              Ratio
            </h4>
            <div className="relative w-full rounded-xl py-2 px-3 flex items-center">
              <RatioDropdown />
            </div>
          </section>

          <section className="space-y-2 w-full">
            <SaudiCityDropdown />
          </section>
          {/* Widget position */}
          <section className="space-y-2 w-full">
            <h4 className="text-sm text-gray-500 lg:text-base font-semibold">
              Widget position
            </h4>

            <select
              className="w-full mt-3 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mainred)]"
              value={(currentWidget?.position ?? "center") as WidgetPosition}
              onChange={(e) =>
                handleWidgetPositionChange(e.target.value as WidgetPosition)
              }
              disabled={!currentWidget}
            >
              {(
                [
                  "center",
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ] as WidgetPosition[]
              ).map((pos) => (
                <option key={pos} value={pos}>
                  {pos.replace("-", " ")}
                </option>
              ))}
            </select>

            {!currentWidget && (
              <p className="text-xs text-gray-500">
                Add a widget to a slot to enable this.
              </p>
            )}
          </section>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-gray-200 bg-white p-4 space-y-2 sticky bottom-0">
          <button
            onClick={handleCancel}
            className="w-full bg-white text-black font-semibold py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          {!isEdit ? (
            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Playlist"}
            </button>
          ) : (
            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition disabled:opacity-60"
            >
              {saving ? "Applying..." : "Apply Changes"}
            </button>
          )}
        </div>
      </aside>

      <BaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Choose Widget "
      >
        <WidgetModels
          onClose={() => setModalOpen(false)}
          selectedCity={playlist.selectedCity}
        />
      </BaseModal>
    </>
  );
};

export default Tabbarplaylist;
