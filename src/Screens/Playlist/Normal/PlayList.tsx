import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store";

import TwobyTwoGrid from "../../../Components/NormalPlayListComp/Grids/TwoGrids/TwobyTwoGrid";
import TwobyTwoGridCol from "../../../Components/NormalPlayListComp/Grids/TwoGrids/TwobyTwoGridCol";
import ThreeInRow from "../../../Components/NormalPlayListComp/Grids/ThreeGrids/ThreeInRow";
import ThreeInCol from "../../../Components/NormalPlayListComp/Grids/ThreeGrids/ThreeInCol";
import FourGrid from "../../../Components/NormalPlayListComp/Grids/FourGrid/FourGrid";
import DefaultGrid from "../../../Components/NormalPlayListComp/Grids/DefaultGrid";

import Tabbarplaylist from "../../../Components/NormalPlayListComp/Tabbarplaylist";
import NormalSlider from "../../../Components/NormalPlayListComp/SlidesContainer/NormalSlider";

import { useLeaveGuard } from "../../../Hook/Playlist/useLeaveGuard";
import { clearPlaylist } from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";

const PlayList = () => {
  const dispatch = useDispatch();

  const playlist = useSelector((state: RootState) => state.playlist);

  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );

  const selectedSlide =
    selectedSlideIndex !== null ? playlist.slides[selectedSlideIndex] : null;

  const selectedGrid = selectedSlide?.selectedGrid || "default";

  const hasUnsaved = playlist.slides.length > 0;

  // Guard: confirm before leaving; on confirm, clear and go to /playlist
  const { Dialog } = useLeaveGuard({
    when: hasUnsaved,
    onConfirmLeave: () => dispatch(clearPlaylist()),
    redirectPath: "/playlist",
  });

  const renderSelectedGrid = () => {
    switch (selectedGrid) {
      case "twobyTwo":
        return <TwobyTwoGrid />;
      case "twobyTwoCol":
        return <TwobyTwoGridCol />;
      case "threeRow":
        return <ThreeInRow />;
      case "threeCol":
        return <ThreeInCol />;
      case "fourGrid":
        return <FourGrid />;
      case "default":
      default:
        return <DefaultGrid />;
    }
  };

  return (
    // Mobile-first: column; at lg → row with a fixed sidebar on the left
    <div className="min-h-[100svh] h-dvh bg-white overflow-hidden flex flex-col lg:flex-row">
      <Dialog />

      {/* Sidebar first on lg, on mobile it sits on top full width */}
      <div className="shrink-0">
        <Tabbarplaylist />
      </div>

      {/* Main content: grows and scrolls independently */}
      <main
        className="
          flex-1
          overflow-y-auto
          px-3 sm:px-4 lg:px-6
          py-4 lg:py-6
        "
      >
        {/* Grid stage */}
        <div className="mt-2 sm:mt-4 lg:mt-6">
          {/* Constrain width on very large screens for readability */}
          <div className="mx-auto w-full max-w-[1400px]">
            {renderSelectedGrid()}
          </div>
        </div>

        {/* Slider section with nice breathing room */}
        <section className="mt-6 sm:mt-8 lg:mt-10">
          <div className="mx-auto w-full max-w-[1400px]">
            <NormalSlider />
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlayList;
