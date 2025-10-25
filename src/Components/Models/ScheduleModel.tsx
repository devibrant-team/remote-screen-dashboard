import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { selectSelectedBlockId } from "../../Redux/Schedule/SheduleSlice";
import ScreenSchedule from "../../Screens/Schedule/ScreenSchedule";
import { useSaveScheduleBlock } from "../../ReactQuery/Schedule/SaveBlock";
import { useGetScheduleDetails } from "../../ReactQuery/Schedule/ScheduleDetails";

// "18-10-2025" -> "2025-10-18"
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

  // current editable block from Redux
  const block = useSelector((s: RootState) =>
    s.schedule.blocks.find((b) => String(b.id) === String(effectiveBlockId))
  );

  // server schedules (used to detect conflicts)
  const { data: serverBlocks = [] } = useGetScheduleDetails();

  // build set of conflicting screenIds
  const conflictedScreenIds = useMemo(() => {
    const set = new Set<number | string>();
    if (!block) return set;

    const aStartYMD = toYMD(block.startDate);
    const aEndYMD = toYMD(block.endDate);
    const aStartT = block.startTime;
    const aEndT = block.endTime;

    for (const sb of serverBlocks) {
      if (String(sb.id) === String(block.id)) continue;

      const bStartYMD = toYMD(sb.startDate);
      const bEndYMD = toYMD(sb.endDate);

      if (!dateOverlap(aStartYMD, aEndYMD, bStartYMD, bEndYMD)) continue;
      if (!timeOverlap(aStartT, aEndT, sb.startTime, sb.endTime)) continue;

      for (const scr of sb.screens ?? []) {
        if (scr?.screenId != null) {
          set.add(scr.screenId);
        }
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

  // mutation hook that saves a block
  const { mutate, isPending } = useSaveScheduleBlock();

  const canSave = !!block && !isPending;

  const handleSave = () => {
    if (!block) return;

    // 🔴 normalize for API / DTO
    // assume your API expects DD-MM-YYYY for startDate/endDate,
    // and arrays for groups/screens exactly as stored.

    const dto = {
      // force id to string, TS happy + backend happy
      id: String(block.id),

      title: block.title,
      playlistId: block.playlistId,

      startDate: block.startDate, // still "DD-MM-YYYY" in your local state
      endDate: block.endDate,
      startTime: block.startTime,
      endTime: block.endTime,

      // always send arrays (never undefined)
      groups: block.groups ?? [],
      screens: block.screens ?? [],

      ratio: block.ratio,
    };

    mutate(dto, {
      onSuccess: () => {
        onClose?.();
      },
    });
  };

  return (
    <div>
      {/* device/group picker */}
      <ScreenSchedule
        blockId={effectiveBlockId}
        defaultFilter="all"
        conflictedScreenIds={conflictedScreenIds}
      />

      {/* footer buttons */}
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
            canSave
              ? "bg-red-500 hover:bg-red-600"
              : "bg-red-300 cursor-not-allowed",
          ].join(" ")}
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default ScheduleModel;
