import { useState } from "react";
import { Layers, Grid2X2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setPlaylistName } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import GridSelector from "./GridSelector/GridSelector";
import {
  formatPlaylistPayload,
  savePlaylistToDatabase,
} from "../../Hook/Playlist/PostNormalPlaylist";
import type { RootState } from "../../../store";
import { useNavigate } from "react-router-dom";
import { clearPlaylist } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
const Tabbarplaylist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showGridSelector, setShowGridSelector] = useState(false);
  const playlist = useSelector((state: RootState) => state.playlist);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");

  const handleSavePlaylist = async () => {
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const payload = formatPlaylistPayload(playlist);
      console.log("📦 Final Playlist Payload to DB:", payload);

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

                <button className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-white font-semibold py-2 px-4 rounded-md  hover:bg-red-600 transition">
                  <Layers size={18} /> Add Widget
                </button>
              </div>
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
