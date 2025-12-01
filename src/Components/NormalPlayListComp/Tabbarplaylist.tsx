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
import { useAlertDialog } from "@/AlertDialogContext";

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
  const alert = useAlertDialog();
  const handleSavePlaylist = async () => {
    if (!playlist.name || playlist.name.trim() === "") {
      await alert({
        title: "Missing name",
        message: "❌ Please enter a playlist name.",
        buttonText: "OK",
      });
      return;
    }

    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      await savePlaylistToDatabase(playlist, isEdit);
      setSaveMessage("✅ Playlist saved successfully!");

      await alert({
        title: "Playlist saved",
        message: "✅ Playlist saved successfully!",
        buttonText: "Done",
      });
      dispatch(setPlaylistName(""));
      dispatch(clearPlaylist());
      queryClient.invalidateQueries({ queryKey: ["normalplaylist"] });
      navigate("/mediacontent");
    } catch (err: any) {
      console.error("❌ Save failed", err);
      setError("❌ Failed to save playlist.");
      await alert({
        title: "Save failed",
        message: "❌ Failed to save playlist.",
        buttonText: "OK",
      });
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

      {/* Responsive shell: sidebar becomes a sleek panel with better spacing */}
      <aside
        className="
        w-full lg:w-[340px]
        lg:h-[100svh] h-dvh
        bg-white text-[var(--black)]
        border-r border-gray-200/80 shadow-sm
        flex flex-col overflow-hidden
      "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-4">
            <button
              onClick={handleCancel}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mainred)]"
            >
              <ArrowBigLeft size={18} />
              <span>Back</span>
            </button>

            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100/80 px-3 py-1 text-[11px] lg:text-xs font-semibold uppercase tracking-wide text-rose-700 ring-1 ring-rose-200">
              Playlist Editor
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 lg:px-5 lg:pt-5 space-y-6">
          {/* Card: Name */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-xs p-4">
            <label
              htmlFor="playlist-name"
              className="block text-[13px] font-semibold text-gray-600"
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
              className="
              mt-2 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2
              text-sm font-medium text-gray-800 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-[var(--mainred)]
            "
            />
          </section>

          {/* Card: Media controls */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-xs p-4 space-y-3">
            <h4 className="text-[13px] font-semibold text-gray-600">Media</h4>

            <button
              onClick={() => setShowGridSelector(true)}
              className="
              flex items-center justify-center gap-2 w-full rounded-lg
              bg-[var(--mainred)] px-4 py-2.5 text-sm font-semibold text-white
              shadow-sm hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mainred)]
              active:scale-[0.99] transition
            "
            >
              <Grid2X2 size={18} />
              <span>Apply Collage</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="
              group flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mainred)] bg-red-500 text-white
             
            "
            >
              <Layers
                size={18}
                className={!playlist.selectedCity?.trim() ? "opacity-60" : ""}
              />
              <span>Add Widget</span>
            </button>
          </section>

          {/* Card: Ratio */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-xs p-4">
            <h4 className="text-[13px] font-semibold text-gray-600">Ratio</h4>
            <div className="mt-2">
              <RatioDropdown />
            </div>
          </section>

          {/* Card: Widget position */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-xs p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-semibold text-gray-600">
                Widget Position
              </h4>
              {currentWidget ? (
                <span className="text-[11px] rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                  {currentWidget?.type ?? "widget"}
                </span>
              ) : (
                <span className="text-[11px] rounded-full bg-gray-50 px-2 py-0.5 text-gray-400">
                  none
                </span>
              )}
            </div>

            <select
              className="
              mt-2 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2
              text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--mainred)]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
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
              <p className="mt-2 text-[12px] text-gray-500">
                Add a widget to a slot to enable this control.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 space-y-2">
          <button
            onClick={handleCancel}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          {!isEdit ? (
            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="
              w-full rounded-lg bg-[var(--mainred)] px-4 py-2.5 text-sm font-semibold text-white
              hover:bg-red-600 disabled:opacity-60 transition
            "
            >
              {saving ? "Saving..." : "Save Playlist"}
            </button>
          ) : (
            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="
              w-full rounded-lg bg-[var(--mainred)] px-4 py-2.5 text-sm font-semibold text-white
              hover:bg-red-600 disabled:opacity-60 transition
            "
            >
              {saving ? "Applying..." : "Apply Changes"}
            </button>
          )}
        </div>
      </aside>

      {/* Modal */}
      <BaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Choose Widget"
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
