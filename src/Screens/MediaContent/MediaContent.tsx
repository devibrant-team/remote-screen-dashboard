import { Plus } from "lucide-react";
import MediaCard from "./MediaCard";
import { useState } from "react";
import BaseModal from "../../Components/Models/BaseModal";
import PlaylistTypeModal from "../../Components/Models/PlaylistTypeModal";

const MediaContent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="p-6 bg-[var(--white-200)] min-h-screen space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--black)]">
          Media Content
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[var(--mainred)] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-red-600 transition cursor-pointer"
        >
          <Plus size={18} />
          Add New Playlist
        </button>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-[var(--black)] py-5">
          Normal Playlist
        </h2>
        <MediaCard />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-[var(--black)] py-5">
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
