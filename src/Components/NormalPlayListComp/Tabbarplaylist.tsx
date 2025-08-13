import { useState } from "react";
import { Layers, Grid2X2, ChevronDown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setPlaylistName } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import GridSelector from "./GridSelector/GridSelector";
import { savePlaylistToDatabase } from "../../Hook/Playlist/PostNormalPlaylist";
import { store, type RootState } from "../../../store";
import { useNavigate } from "react-router-dom";
import { clearPlaylist } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { updateSlotMedia } from "../../Redux/Playlist/ToolBarFunc/SlideNormalPlaylistSlice";
import { updateSlotWidgetInSlide } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { setPlaylistRatio } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import type { MediaItem } from "../../Hook/Media/useGetMedia";
import UserMediaGrid from "../Media/UserMediaGrid";
import {
  toggleMediaSelection,
  selectSelectedMedia,
  selectSelectedMediaIds,
} from "../../Redux/Media/MediaSlice";
import type { Root } from "react-dom/client";
const Tabbarplaylist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showGridSelector, setShowGridSelector] = useState(false);
  const playlist = useSelector((state: RootState) => state.playlist);
  const [saving, setSaving] = useState(false);
  const DEFAULT_BG = "/assets/weather_default_bg.jpg";
  const [, setSaveMessage] = useState("");
  const [, setError] = useState("");

  const selectedRatio = useSelector(
    (state: RootState) => state.playlist.selectedRatio
  );

  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  const slide = useSelector((state: RootState) =>
    selectedSlideIndex !== null
      ? state.playlist.slides[selectedSlideIndex]
      : null
  );
  const selectedMedia = useSelector(selectSelectedMedia);
  const selectedMediaIds = useSelector(selectSelectedMediaIds);

  console.log("hahahhahhahahhahah", selectedMedia);
  const handleToggleMedia = (item: MediaItem) => {
    // MediaItem: { id, type, media }
    dispatch(
      toggleMediaSelection({
        id: item.id,
        url: item.media,
        type: item.type,
      })
    );
  };
  const handleSavePlaylist = async () => {
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      await savePlaylistToDatabase(playlist);

      setSaveMessage("✅ Playlist saved successfully!");
      window.alert("✅ Playlist saved successfully!"); // ✅ alert on success
    } catch (err: any) {
      console.error("❌ Save failed", err);
      setError("❌ Failed to save playlist.");
      window.alert("❌ Failed to save playlist."); // ✅ alert on error
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    dispatch(clearPlaylist());
    navigate("/mediacontent");
  };

  const handleAddWeatherWidget = () => {
    if (selectedSlideIndex === null || !slide) {
      alert("Please select/create a slide first.");
      return;
    }

    const slotIndex = 0;
    const slot = slide.slots[slotIndex];

    if (!slot?.media) {
      dispatch(
        updateSlotMedia({
          index: slotIndex,
          media: DEFAULT_BG,
          mediaType: "image",
        })
      );
    } else {
      //null
    }

    const widget = {
      type: "weather",
      city: "Riyadh",
      position: "center",
    } as const;

    dispatch(
      updateSlotWidgetInSlide({
        slideIndex: selectedSlideIndex!, // ✅ which slide
        slotIndex: 0, // ✅ which slot in that slide
        widget: {
          type: "weather",
          city: "Riyadh",
          position: "center",
        },
      })
    );
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "16:9" | "21:9" | "9:16" | "4:3";
    dispatch(setPlaylistRatio(value));
  };

  return (
    <>
      {showGridSelector && (
        <GridSelector onClose={() => setShowGridSelector(false)} />
      )}

      <div className="flex flex-col lg:flex-row min-h-screen bg-[var(--white-200)]">
        <div className="w-full lg:w-72 bg-[var(--white)] text-[var(--black)] shadow-md border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col h-screen">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            <h1 className="text-xl lg:text-2xl font-bold text-red-700">
              Playlist Editor
            </h1>

            <div className="space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="playlist-name"
                  className="text-base lg:text-lg font-semibold"
                >
                  Playlist Name
                </label>
                <input
                  id="playlist-name"
                  onChange={(e) => dispatch(setPlaylistName(e.target.value))}
                  type="text"
                  placeholder="Enter playlist name"
                  className="w-full p-2 rounded-md text-black border border-gray-300 focus:ring-2 focus:ring-[var(--mainred)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-base lg:text-lg font-semibold">Media</h4>

                <button
                  onClick={() => setShowGridSelector(true)}
                  className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition"
                >
                  <Grid2X2 size={18} />
                  Choose Collage
                </button>

                <button
                  onClick={handleAddWeatherWidget}
                  className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md  hover:bg-red-600 transition"
                >
                  <Layers size={18} /> Add Widget
                </button>
              </div>
              <h4 className="text-base lg:text-lg font-semibold">Ratio</h4>
              <div className="relative border-2 rounded-2xl py-2 px-3 border-gray-300 shadow flex items-center">
                <select
                  value={selectedRatio}
                  onChange={handleRatioChange}
                  className="w-full appearance-none bg-transparent outline-none pr-8"
                  aria-label="Aspect ratio"
                >
                  <option value="16:9">16:9</option>
                  <option value="21:9">21:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                </select>
                <ChevronDown
                  className="absolute right-3 text-red-500 pointer-events-none"
                  size={18}
                />
              </div>
              <UserMediaGrid
                mode="multi"
                // variant defaults to "normal"
                selectedIds={selectedMediaIds}
                onToggle={handleToggleMedia}
                maxHeight={320}
              />
            </div>
          </div>

          <div className="border-t pt-4 pb-6 px-4 space-y-2 border-gray-300">
            <button
              onClick={handleCancel} // ✅ navigate + clear
              className="w-full bg-white text-black font-semibold py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Playlist"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tabbarplaylist;
