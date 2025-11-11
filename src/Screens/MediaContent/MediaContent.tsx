import { Plus } from "lucide-react";
import { useState } from "react";
import BaseModal from "../../Components/Models/BaseModal";
import PlaylistTypeModal from "../../Components/Models/PlaylistTypeModal";
import NormalPlaylistCard from "./NormalPlaylistCard";
import InteractivePlaylist from "./InteractivePlaylistCard";
import NormalMoreModal from "../../Components/Models/PlaylistsModals/NormalMoreModal";
import InteractiveMoreModal from "../../Components/Models/PlaylistsModals/InteractiveMoreModal";
import { useDispatch } from "react-redux";
import { setIsEdit } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import CountryCitySelect from "../Test";

type ModalKind = "none" | "add" | "normalMore" | "interactiveMore";

const MediaContent = () => {
  const [openModal, setOpenModal] = useState<ModalKind>("none");
  const dispatch = useDispatch();
  const handleAddClick = () => {
    setOpenModal("add");
    dispatch(setIsEdit(false));
  };

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 bg-[var(--white-200)] min-h-screen space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--black)]">
          Media Content
        </h1>
        <button
          onClick={handleAddClick}
          className="bg-[var(--mainred)] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow hover:bg-red-600 transition text-sm"
        >
          <Plus size={16} />
          <span>Add New Playlist</span>
        </button>
      </div>

      {/* Normal Playlist */}
      <div>
        <div className="flex justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--black)] py-3 sm:py-4">
            Show Playlist
          </h2>
          <button
            className="text-red-500 font-semibold"
            onClick={() => setOpenModal("normalMore")}
          >
            View More
          </button>
        </div>
        <NormalPlaylistCard /> {/* renders first 3 */}
      </div>

      {/* Interactive Playlist */}
      <div>
        <div className="flex justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--black)] py-3 sm:py-4">
            Interactive Playlist
          </h2>
          <button
            className="text-red-500 font-semibold"
            onClick={() => setOpenModal("interactiveMore")}
          >
            View More
          </button>
        </div>
        <InteractivePlaylist /> {/* renders first 3 */}
      </div>

      {/* Modals */}
      <BaseModal
        open={openModal === "add"}
        onClose={() => setOpenModal("none")}
        title="Choose Playlist Type"
      >
        <PlaylistTypeModal />
      </BaseModal>

      <NormalMoreModal
        open={openModal === "normalMore"}
        onClose={() => setOpenModal("none")}
      />

      <InteractiveMoreModal
        open={openModal === "interactiveMore"}
        onClose={() => setOpenModal("none")}
      />
    </div>
  );
};

export default MediaContent;
