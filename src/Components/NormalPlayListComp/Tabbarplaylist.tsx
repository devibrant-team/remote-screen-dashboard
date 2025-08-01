import { Upload, Plus, Layers, ChevronDown } from "lucide-react";

const Tabbarplaylist = () => {
  return (
    <div className="flex min-h-screen bg-[var(--white-200)]">
      {/* Sidebar */}
      <div className="w-72 bg-[var(--white)] text-[var(--black)] p-6 space-y-6 shadow-md">
        <h1 className="text-2xl font-bold text-red-700">Playlist Editor</h1>

        <div className="space-y-5">
          {/* Playlist Name */}
          <div>
            <h4 className="text-lg font-semibold">Playlist Name</h4>
            <input
              type="text"
              placeholder="Enter playlist name"
              className="w-full mt-1 p-2 rounded-md text-black border border-gray-300 focus:ring-2 focus:ring-[var(--mainred)] focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <h4 className="text-lg font-semibold">Duration (seconds)</h4>
            <input
              type="number"
              defaultValue={10}
              className="w-full mt-1 p-2 rounded-md text-black border border-gray-300 focus:ring-2 focus:ring-[var(--mainred)] focus:outline-none"
            />
          </div>

          {/* Scale */}
          <div>
            <h4 className="text-lg font-semibold mb-1">Scale</h4>
            <div className="relative">
              <select className="w-full appearance-none p-2 pr-10 rounded-md text-black border border-gray-300 bg-white focus:ring-2 focus:ring-[var(--mainred)] focus:outline-none">
                <option>Original Scale</option>
                <option>Scale to fit</option>
                <option>Scale Stretch to fit</option>
                <option>Fit with Blur background</option>
              </select>
              <ChevronDown className="absolute top-2.5 right-3 text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Media Buttons */}
          <div>
            <h4 className="text-lg font-semibold mb-2">Media</h4>
            <button className="flex items-center justify-center gap-2 w-full bg-[var(--white)] text-[var(--black)] font-semibold py-2 px-4 rounded-md mb-2 border border-gray-300 hover:bg-gray-100 transition">
              <Upload size={18} /> Upload Media
            </button>
            <button className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-[var(--white)] font-semibold py-2 px-4 rounded-md mb-2 hover:bg-red-600 transition">
              <Plus size={18} /> Add Template
            </button>
            <button className="flex items-center justify-center gap-2 w-full bg-[var(--mainred)] text-[var(--white)] font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition">
              <Layers size={18} /> Add Widget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tabbarplaylist;
