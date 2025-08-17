import { useState } from "react";
import { Layers, Grid2X2, ChevronDown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setPlaylistName, clearPlaylist, setPlaylistRatio } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import GridSelector from "./GridSelector/GridSelector";
import { savePlaylistToDatabase } from "../../Hook/Playlist/PostNormalPlaylist";
import type { RootState } from "../../../store";
import { useNavigate } from "react-router-dom";

import BaseModal from "../Models/BaseModal";
import WidgetModels from "../Models/WidgetModels";

const Tabbarplaylist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [showGridSelector, setShowGridSelector] = useState(false);
  const playlist = useSelector((state: RootState) => state.playlist);
  const [saving, setSaving] = useState(false);
  const [, setSaveMessage] = useState("");
  const [, setError] = useState("");
console.log(playlist)
  const selectedRatio = useSelector(
    (state: RootState) => state.playlist.selectedRatio
  );

  const handleSavePlaylist = async () => {
    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      await savePlaylistToDatabase(playlist);
      setSaveMessage("✅ Playlist saved successfully!");
      window.alert("✅ Playlist saved successfully!");
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

  const handleRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "16:9" | "21:9" | "9:16" | "4:3" | "3:4";
    dispatch(setPlaylistRatio(value));
  };

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
        {/* Sticky header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 sticky top-0 bg-[var(--white)] z-10">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-700">
            Playlist Editor
          </h1>
        </div>

        {/* Single scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Playlist name */}
          <section className="space-y-2">
            <label htmlFor="playlist-name" className="text-sm lg:text-base font-semibold">
              Playlist Name
            </label>
            <input
              id="playlist-name"
              onChange={(e) => dispatch(setPlaylistName(e.target.value))}
              type="text"
              placeholder="Enter playlist name"
              className="w-full p-2 rounded-md text-black border border-gray-300 focus:ring-2 focus:ring-[var(--mainred)] focus:outline-none"
            />
          </section>

          {/* Media Controls */}
          <section className="space-y-3">
            <h4 className="text-sm lg:text-base font-semibold">Media</h4>

            <button
              onClick={() => setShowGridSelector(true)}
              className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition"
            >
              <Grid2X2 size={18} />
              Choose Collage
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition"
            >
              <Layers size={18} />
              Add Widget
            </button>
          </section>

          {/* Ratio */}
          <section className="space-y-2">
            <h4 className="text-sm lg:text-base font-semibold">Ratio</h4>
            <div className="relative border rounded-xl py-2 px-3 border-gray-300 shadow-sm flex items-center">
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
              <ChevronDown className="absolute right-3 text-red-500 pointer-events-none" size={18} />
            </div>
          </section>

          {/* Media gallery (no extra overflow here; uses the main scroll) */}
          {/* <section>
            <NormalMediaSelector />
          </section> */}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-gray-200 bg-white p-4 space-y-2 sticky bottom-0">
          <button
            onClick={handleCancel}
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
      </aside>

      <BaseModal open={modalOpen} onClose={() => setModalOpen(false)} title="Choose Widget ">
        <WidgetModels onClose={() => setModalOpen(false)} />
      </BaseModal>
    </>
  );
};

export default Tabbarplaylist;
