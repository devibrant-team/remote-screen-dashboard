import { Plus } from "lucide-react";
import MediaCard from "./MediaCard";
import { useState } from "react";
import BaseModal from "../../Components/Models/BaseModal";
import PlaylistTypeModal from "../../Components/Models/PlaylistTypeModal";

const MediaContent = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 bg-[var(--white-200)] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--black)]">
          Media Content
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[var(--mainred)] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow hover:bg-red-600 transition text-sm"
        >
          <Plus size={16} />
          <span>Add New Playlist</span>
        </button>
      </div>

      {/* Normal Playlist */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--black)] py-3 sm:py-4">
          Normal Playlist
        </h2>
        <MediaCard />
      </div>

      {/* Interactive Playlist */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--black)] py-3 sm:py-4">
          Interactive Playlist
        </h2>
        <MediaCard />
      </div>

      {/* Playlist Type Modal */}
      <BaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Choose Playlist Type"
      >
        <PlaylistTypeModal />
      </BaseModal>
    </div>
  );
};

export default MediaContent;
