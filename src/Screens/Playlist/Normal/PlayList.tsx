import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";

import TwobyTwoGrid from "../../../Components/NormalPlayListComp/Grids/TwoGrids/TwobyTwoGrid";
import TwobyTwoGridCol from "../../../Components/NormalPlayListComp/Grids/TwoGrids/TwobyTwoGridCol";
import ThreeInRow from "../../../Components/NormalPlayListComp/Grids/ThreeGrids/ThreeInRow";
import ThreeInCol from "../../../Components/NormalPlayListComp/Grids/ThreeGrids/ThreeInCol";
import FourGrid from "../../../Components/NormalPlayListComp/Grids/FourGrid/FourGrid";
import DefaultGrid from "../../../Components/NormalPlayListComp/Grids/DefaultGrid";

import Tabbarplaylist from "../../../Components/NormalPlayListComp/Tabbarplaylist";
import NormalSlider from "../../../Components/NormalPlayListComp/SlidesContainer/NormalSlider";

const PlayList = () => {
  const selectedSlideIndex = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );

  const selectedSlide = useSelector((state: RootState) =>
    selectedSlideIndex !== null
      ? state.playlist.slides[selectedSlideIndex]
      : null
  );

  const selectedGrid = selectedSlide?.selectedGrid || "default";

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
    <div className="flex min-h-screen w-full bg-[var(--white-200)]">
      <Tabbarplaylist />
      <div className="flex-1 p-6">
        <div className="mt-6">{renderSelectedGrid()}</div>
        <NormalSlider />
      </div>
    </div>
  );
};

export default PlayList;
