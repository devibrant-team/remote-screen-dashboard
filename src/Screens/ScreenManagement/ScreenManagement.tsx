import React from "react";
import AddBranchModal from "./AddBranchModal";

import ScreenHeader from "./ScreenHeader";
import type { BranchOption } from "./ScreenHeader";

import SingleScreensSection from "./SingleScreensSection";
import type { SingleScreen } from "./SingleScreensSection";

import GroupScreensSection from "./GroupScreensSection";
import type { GroupScreen } from "./GroupScreensSection";

// If you use React Query fetching for branches:
// import { useBranches } from "../ReactQuery/Branch/useBranches"; // optional

export default function ScreenManagement() {
  const [branch, setBranch] = React.useState<string | number>("All Branches");
  const [query, setQuery] = React.useState("");
  const [showAddBranch, setShowAddBranch] = React.useState(false);

  // Demo data
  const singleScreens: SingleScreen[] = [
    { id: 1, name: "Test", ratio: "9:16", branch: "Downtown Branch", group: "No Group" },
    { id: 2, name: "LOL", ratio: "9:16", branch: "Downtown Branch", group: "No Group" },
  ];
  const groupScreens: GroupScreen[] = [
    { id: 10, name: "Group1", status: "unassigned", ratio: "", screensCount: 1, branch: "Downtown Branch", tags: ["Test"] },
    { id: 11, name: "Group1", status: "", ratio: "16:9", screensCount: 1, branch: "Downtown Branch", tags: ["Test"] },
  ];

  // If fetching from backend:
  // const { data: backendBranches = [], isLoading } = useBranches();
  // const branches: BranchOption[] = [{ id: "all", name: "All Branches" }, ...backendBranches.map(b => ({ id: b.id, name: b.name }))];

  // Local demo branches:
  const branches: BranchOption[] = [
    { id: "all", name: "All Branches" },
    { id: "d", name: "Downtown Branch" },
    { id: "u", name: "Uptown Branch" },
  ];
  const isLoading = false;

  const filteredSingles = singleScreens.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredGroups = groupScreens.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <ScreenHeader
        branchValue={branch}
        setBranchValue={setBranch}
        branches={branches}
        query={query}
        setQuery={setQuery}
        onAddBranch={() => setShowAddBranch(true)}
        isBranchesLoading={isLoading}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SingleScreensSection items={filteredSingles} onAdd={() => alert("Add Screen clicked")} />
        <GroupScreensSection items={filteredGroups} onAdd={() => alert("Add Group clicked")} />
      </div>

      <AddBranchModal open={showAddBranch} onClose={() => setShowAddBranch(false)} />
    </div>
  );
}
