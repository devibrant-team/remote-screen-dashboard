// src/Components/Models/ScheduleModel.tsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { selectSelectedBlockId } from "../../Redux/Schedule/SheduleSlice";
import ScreenSchedule from "../../Screens/Schedule/ScreenSchedule";
import { useSaveScheduleBlock } from "../../ReactQuery/Schedule/SaveBlock";
import { useGetScheduleDetails } from "../../ReactQuery/Schedule/ScheduleDetails";

/** ---------- helpers ---------- */

// "18-10-2025" -> "2025-10-18" (zero-padded, ISO-sortable)
const toYMD = (df: string) => {
  const [d, m, y] = df.split("-").map((s) => s.trim());
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

// "08:00:00" -> seconds
const tToSec = (t: string) => {
  const [h = "0", m = "0", s = "0"] = t.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

// Inclusive date-range overlap (per-day expansion semantics)
const dateOverlap = (
  aStartYMD: string,
  aEndYMD: string,
  bStartYMD: string,
  bEndYMD: string
) => {
  const startMax = aStartYMD > bStartYMD ? aStartYMD : bStartYMD;
  const endMin = aEndYMD < bEndYMD ? aEndYMD : bEndYMD;
  return startMax <= endMin;
};

// Strict time overlap (touching edges NO conflict)
const timeOverlap = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) => tToSec(aStart) < tToSec(bEnd) && tToSec(bStart) < tToSec(aEnd);

type Props = { blockId?: string; onClose?: () => void };

const ScheduleModel: React.FC<Props> = ({ blockId, onClose }) => {
  // Prefer explicit prop; fallback to Redux-selected block id
  const selectedBlockId = useSelector(selectSelectedBlockId);
  const effectiveBlockId = blockId ?? selectedBlockId ?? undefined;

  // Current block from Redux (the one being edited)
  const block = useSelector((s: RootState) =>
    s.schedule.blocks.find((b) => b.id === effectiveBlockId)
  );

  // Server schedules mapped to ScheduleBlock-like rows
  const { data: serverBlocks = [] } = useGetScheduleDetails();

  // Screens that conflict with the *current* block
  const conflictedScreenIds = useMemo(() => {
    const set = new Set<number | string>();
    if (!block) return set;

    const aStartYMD = toYMD(block.startDate);
    const aEndYMD = toYMD(block.endDate);
    const aStartT = block.startTime;
    const aEndT = block.endTime;

    for (const sb of serverBlocks) {
      // If the server returns the same id as the local one, skip self
      if (String(sb.id) === String(block.id)) continue;

      const bStartYMD = toYMD(sb.startDate);
      const bEndYMD = toYMD(sb.endDate);

      // ✅ No conflict if dates don't overlap (same time but different dates is OK)
      if (!dateOverlap(aStartYMD, aEndYMD, bStartYMD, bEndYMD)) continue;

      // ✅ Time windows must also overlap
      if (!timeOverlap(aStartT, aEndT, sb.startTime, sb.endTime)) continue;

      for (const scr of sb.screens ?? []) {
        if (scr?.screenId != null) set.add(scr.screenId);
      }
    }
    return set;
  }, [
    block?.id,
    block?.startDate,
    block?.endDate,
    block?.startTime,
    block?.endTime,
    serverBlocks,
  ]);

  // Save
  const { mutate, isPending } = useSaveScheduleBlock();
  const canSave = !!block && !isPending;

  const handleSave = () => {
    if (!block) return;
    // Send as-is; your hook transforms & sends token
    mutate(block, { onSuccess: () => onClose?.() });
  };

  return (
    <div>
      {/* Pass conflict set down so UI can disable conflicted screens */}
      <ScreenSchedule
        blockId={effectiveBlockId}
        defaultFilter="all"
        conflictedScreenIds={conflictedScreenIds}
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Close
        </button>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={[
            "rounded-md px-4 py-1.5 text-sm font-semibold text-white",
            canSave ? "bg-red-500 hover:bg-red-600" : "bg-red-300 cursor-not-allowed",
          ].join(" ")}
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default ScheduleModel;
