import { Plus } from "lucide-react";
import BranchCard from "./BranchCard";
import { useState } from "react";

const BranchScreen = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  return (
    <div className="">
     
      <BranchCard />
    </div>
  );
};

export default BranchScreen;
