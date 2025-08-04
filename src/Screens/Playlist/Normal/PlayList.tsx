import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";

import GridSelector from "../../../Components/NormalPlayListComp/GridSelector/GridSelector";
import TwobyTwoGrid from "../../../Components/NormalPlayListComp/Grids/TwoGrids/TwobyTwoGrid";
import TwobyTwoGridCol from "../../../Components/NormalPlayListComp/Grids/TwoGrids/TwobyTwoGridCol";
import ThreeInRow from "../../../Components/NormalPlayListComp/Grids/ThreeGrids/ThreeInRow";
import ThreeInCol from "../../../Components/NormalPlayListComp/Grids/ThreeGrids/ThreeInCol";
import FourGrid from "../../../Components/NormalPlayListComp/Grids/FourGrid/FourGrid";
import DefaultGrid from "../../../Components/NormalPlayListComp/Grids/DefaultGrid";
import Tabbarplaylist from "../../../Components/NormalPlayListComp/Tabbarplaylist";

const PlayList = () => {
  const selectedGrid = useSelector(
    (state: RootState) => state.normalplaylist.selectedGrid
  );

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
      </div>
    </div>
  );
};

export default PlayList;
