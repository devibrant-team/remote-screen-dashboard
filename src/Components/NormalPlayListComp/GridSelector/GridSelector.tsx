import { useDispatch } from "react-redux";
import { setSelectedGrid } from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
type GridSelectorProps = {
  onClose: () => void;
};
const GridSelector: React.FC<GridSelectorProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const handleSelect = (gridKey: string) => {
    dispatch(setSelectedGrid(gridKey));
    onClose();
  };

  const gridOptions = [
    { key: "default", label: "Default" },
    { key: "twobyTwo", label: "2x2" },
    { key: "twobyTwoCol", label: "2Col" },
    { key: "threeRow", label: "3Row" },
    { key: "threeCol", label: "3Col" },
    { key: "fourGrid", label: "4Grid" },
  ];

  const renderGridPreview = (key: string) => {
    switch (key) {
      case "default":
        return (
          <div className="flex flex-col w-14 h-16 gap-1">
            {[...Array(1)].map((_, i) => (
              <div key={i} className="bg-gray-400 flex-1 rounded-sm" />
            ))}
          </div>
        );

      case "twobyTwo":
        return (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-16 gap-0.5">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-400 w-full h-full rounded-sm" />
            ))}
          </div>
        );
      case "fourGrid":
        return (
          <div className="grid grid-cols-2 grid-rows-2 w-16 h-16 gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-400 w-full h-full rounded-sm" />
            ))}
          </div>
        );
      case "twobyTwoCol":
        return (
          <div className="flex flex-col w-14 h-16 gap-1">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-400 flex-1 rounded-sm" />
            ))}
          </div>
        );
      case "threeRow":
        return (
          <div className="flex w-16 h-14 gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-400 flex-1 rounded-sm" />
            ))}
          </div>
        );
      case "threeCol":
        return (
          <div className="flex flex-col w-14 h-16 gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-400 flex-1 rounded-sm" />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>

        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-gray-800 text-center">
              Select Grid Layout
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {gridOptions.map((grid) => (
                <button
                  key={grid.key}
                  onClick={() => handleSelect(grid.key)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                >
                  {renderGridPreview(grid.key)}
                </button>
              ))}
            </div>

            <button
             onClick={() => onClose()}

              className="text-sm text-white bg-red-500 py-1 px-2 rounded-lg hover:underline block text-center mt-3"
            >
              Cancel
            </button>
          </div>
        </div>
   
    </div>
  );
};

export default GridSelector;
