import { useState } from "react";
import { Plus } from "lucide-react";
import AddBranchModal from "./AddBranchModal";

const ScreenHeader = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleOpen = () => setIsAddOpen(true);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center ">
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold transition hover:scale-105 focus:ring-offset-1"
          >
            <Plus size={18} color="red" />
            <p
              className="text-red-500 hover:text-red-600 cursor-pointer"
              onClick={handleOpen}
            >
              New Branch
            </p>
          </button>
        </div>
      </div>

      <AddBranchModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
};

export default ScreenHeader;
