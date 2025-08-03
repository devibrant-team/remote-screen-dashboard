import DefaultGrid from "../../../Components/NormalPlayListComp/Grids/DefaultGrid";
import Tabbarplaylist from "../../../Components/NormalPlayListComp/Tabbarplaylist";

const PlayList = () => {
  return (
    <div className="flex min-h-screen w-full bg-[var(--white-200)]">
      {/* Left Sidebar */}
      <Tabbarplaylist />

      {/* Main Content Area - add other components here */}
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold text-[var(--black)] mb-4">
          Main Preview Area
        </h2>
        <DefaultGrid />
      </div>
    </div>
  );
};

export default PlayList;
