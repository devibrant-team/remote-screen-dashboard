import { useState } from "react";
import { useDispatch } from "react-redux";
import { saveLayoutId } from "../../../Redux/Playlist/interactivePlaylist/playlistInteractiveSlice";
import BaseModal from "../../Models/BaseModal";
import CreateInteractivePlaylist from "../InteractivePlaylist/InteractivePlaylist";
import { X } from "lucide-react";

type InteractiveLayoutDemosProps = {
  onClose: () => void;
};

export default function InteractiveLayoutDemos({
  onClose,
}: InteractiveLayoutDemosProps) {
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const dispatch = useDispatch();

  const handleSelect = (layout: string) => {
    setSelectedLayout(layout);

    // Dispatch layout ID
    const layoutId = layout === "tree" ? 2 : layout === "continuous" ? 3 : null;
    if (layoutId) {
      dispatch(saveLayoutId(layoutId));
      setModalOpen(true); // Open CreateInteractivePlaylist modal
    }
  };

  return (
    <>
      {/* Main Layout Selection UI */}
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-semibold mb-4 text-center">
            Interactive Layout Demos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tree Slider */}
            <div
              onClick={() => handleSelect("tree")}
              className={`cursor-pointer p-4 border rounded-lg hover:shadow transition ${
                selectedLayout === "tree"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h3 className="text-lg font-semibold text-[var(--black)] mb-1">
                Tree Slider
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Great for displaying products
              </p>
              <div className="bg-gray-50 rounded-xl p-4 flex justify-center items-center w-full h-auto">
                <svg
                  className="w-[120px] h-auto md:w-[140px] lg:w-[160px]"
                  viewBox="0 0 120 80"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <circle cx="60" cy="20" r="10" fill="#3B82F6" />
                  <line
                    x1="60"
                    y1="20"
                    x2="35"
                    y2="50"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                  />
                  <line
                    x1="60"
                    y1="20"
                    x2="85"
                    y2="50"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                  />
                  <line
                    x1="35"
                    y1="50"
                    x2="25"
                    y2="70"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                  />
                  <line
                    x1="85"
                    y1="50"
                    x2="95"
                    y2="70"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                  />
                  <circle cx="35" cy="50" r="8" fill="#10B981" />
                  <circle cx="85" cy="50" r="8" fill="#10B981" />
                  <circle cx="25" cy="70" r="8" fill="#D1D5DB" />
                  <circle cx="95" cy="70" r="8" fill="#D1D5DB" />
                </svg>
              </div>
            </div>

            {/* Continuous Slider */}
            <div
              onClick={() => handleSelect("continuous")}
              className={`cursor-pointer p-4 border rounded-lg hover:shadow transition ${
                selectedLayout === "continuous"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h3 className="font-bold text-lg mb-1">Continuous Slider</h3>
              <p className="text-sm text-gray-600 mb-4">
                Great for displaying arrays
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-10 rounded ${
                      i === 0 || i === 4
                        ? "bg-red-500"
                        : i === 8
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => selectedLayout && setModalOpen(true)}
              className={`px-4 py-2 rounded text-white ${
                selectedLayout
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!selectedLayout}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Modal to create playlist */}
      <BaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Interactive Playlist"
      >
        <CreateInteractivePlaylist
          onCloseAll={() => {
            setModalOpen(false); // Close nested modal
            onClose(); // Close parent modal
          }}
        />{" "}
      </BaseModal>
    </>
  );
}
