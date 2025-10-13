import { useState } from "react";
import GroupScreensSection from "./GroupScreensSection";
import ScreenHeader from "./ScreenHeader";
import SingleScreensSection from "./SingleScreensSection";
import PlaylistSwiper from "../../Play/Normal/PlaylistSwiper";

const ScreenManagement = () => {
  const [showPlayer, setShowPlayer] = useState(false);

  if (showPlayer) {
    // full screen player mode
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <PlaylistSwiper />
        <button
          onClick={() => setShowPlayer(false)}
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Close Player
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 px-4">
      {/* Page Header */}
      <ScreenHeader />

      {/* Test / Launch Player Button */}
      <div className="mt-4">
        <button
          onClick={() => setShowPlayer(true)}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
        >
          ▶️ Open Playlist Player
        </button>
      </div>

      {/* Content area */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SingleScreensSection />
        <GroupScreensSection />
      </div>
    </div>
  );
};

export default ScreenManagement;
