// src/Components/Models/ScheduleModel.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { updateBlockParts } from "../../Redux/Schedule/SheduleSlice";

import ScreenSchedule from "../../Screens/Schedule/ScreenSchedule";
import GroupSchedule from "../../Screens/Schedule/GroupSchedule";

type Props = {
  blockId?: string;
  onClose?: () => void;
};

const ScheduleModel: React.FC<Props> = ({ blockId, onClose }) => {
  const dispatch = useDispatch();

  // read block to hydrate defaults
  const block = useSelector((s: RootState) =>
    s.schedule.blocks.find((b) => b.id === blockId)
  );

  // controlled selections in parent
  const [tab, setTab] = useState<"screens" | "groups">("screens");
  const [screensSel, setScreensSel] = useState<Array<{ id: number | string }>>(
    []
  );
  const [groupSel, setGroupSel] = useState<number | string | null>(null);

  // hydrate once when block changes
  useEffect(() => {
    if (!block) {
      setScreensSel([]);
      setGroupSel(null);
      return;
    }
    setScreensSel(
      Array.isArray(block.screens)
        ? block.screens.map((s) => ({ id: s.screenId }))
        : []
    );
    setGroupSel(
      typeof (block as any).groupId !== "undefined" &&
      (block as any).groupId !== null
        ? (block as any).groupId
        : null
    );
  }, [block]);

  const tabBtn = (active: boolean) =>
    [
      "px-3 py-1.5 text-sm rounded-md transition",
      active
        ? "bg-white shadow-sm border border-neutral-200"
        : "text-neutral-600 hover:text-neutral-800",
    ].join(" ");

  const handleApply = () => {
    if (!blockId) return;

    dispatch(
      updateBlockParts({
        id: blockId,
        // only send if there are selections
        screens: screensSel.length
          ? screensSel.map((s) => ({ screenId: s.id }))
          : undefined,
        groupId: groupSel != null ? groupSel : undefined,
      })
    );

    onClose?.();
  };

  return (
    <div>
      {/* Toggle */}
      <div className="mb-3 flex items-center">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          <button className={tabBtn(tab === "screens")} onClick={() => setTab("screens")}>
            Screens
          </button>
          <button className={tabBtn(tab === "groups")} onClick={() => setTab("groups")}>
            Groups
          </button>
        </div>
      </div>

      {/* Screens (controlled) */}
      <section className={tab === "groups" ? "hidden" : ""} aria-hidden={tab === "groups"}>
        <ScreenSchedule
          blockId={blockId}
          value={screensSel}
          onChange={setScreensSel}
          // no onDone here; parent owns Apply
        />
      </section>

      {/* Groups (controlled) */}
      <section className={tab === "screens" ? "hidden" : ""} aria-hidden={tab === "screens"}>
        <GroupSchedule
          blockId={blockId}
          value={groupSel}
          onChange={setGroupSel}
          // no onDone here; parent owns Apply
        />
      </section>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
          disabled={!blockId}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default ScheduleModel;
