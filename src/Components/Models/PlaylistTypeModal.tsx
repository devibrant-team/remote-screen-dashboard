import { ListVideo, ActivitySquare, Globe } from "lucide-react";
import InteractiveLayoutDemos from "../InteractivePlaylist/InteractiveLayoutDemos/InteractiveLayoutDemos";
import BaseModal from "./BaseModal";
import { useState } from "react";

// Static playlist styles treeslider id 2 and continus slider is 4 
const playlistTypes = [
  {
    id: 1,
    type: "Normal",
    description: "Standard playlist layout",
  },
  {
    id: 2,
    type: "Interactive",
    description: "Touch-enabled interactive playlist",
  },
  {
    id: 3,
    type: "Website",
    description: "Displays a website or external URL",
  },
];

// Icon mapping for each type
const iconMap: Record<string, any> = {
  Normal: ListVideo,
  Interactive: ActivitySquare,
  Website: Globe,
};

const PlaylistTypeModal = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (type: string) => {
    if (type === "Interactive") {
      setModalOpen(true);
    } else if (type === "Website") {
      console.log("Website type selected");
    }
  };

  return (
    <>
      <div className="space-y-4">
        {playlistTypes.map((type) => {
          const Icon = iconMap[type.type] || ListVideo;

          return (
            <div
              key={type.id}
              onClick={() => handleSelect(type.type)}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
            >
              <div className="mt-1 text-[var(--mainred)]">
                <Icon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--black)]">
                  {type.type} Playlist
                </h2>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <BaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Choose Layout Type"
      >
        <InteractiveLayoutDemos onClose={() => setModalOpen(false)} />
      </BaseModal>
    </>
  );
};

export default PlaylistTypeModal;
