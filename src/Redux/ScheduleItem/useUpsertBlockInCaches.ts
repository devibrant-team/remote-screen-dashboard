// src/Redux/ScheduleItem/useUpsertBlockInCaches.ts
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import type { RootState } from "../../../store";

import type { ScheduleBlock } from "./GetScheduleItemBlocks";
import {
  upsertScheduleItemBlocks,
  selectScheduleItemId,
} from "./ScheduleItemSlice";
import { SCHEDULE_ITEM_BLOCKS_BY_VIEW_QK } from "./useScheduleItemBlocksByView";

export function useUpsertBlockInCaches() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const scheduleItemId = useSelector(selectScheduleItemId);
  const { viewKey } = useSelector((s: RootState) => s.calendarView);

  return useCallback(
    (block: ScheduleBlock) => {
      // 1) Redux – add/update inside scheduleItemBlocks for current item
      dispatch(upsertScheduleItemBlocks([block]));

      // 2) React Query cache – keep [id, viewKey] in sync
      if (scheduleItemId && viewKey) {
        queryClient.setQueryData<ScheduleBlock[]>(
          [SCHEDULE_ITEM_BLOCKS_BY_VIEW_QK, scheduleItemId, viewKey],
          (old) => {
            if (!old || old.length === 0) return [block];

            const idx = old.findIndex((b) => b.id === block.id);
            if (idx === -1) return [...old, block];

            const copy = [...old];
            copy[idx] = block;
            return copy;
          }
        );
      }
    },
    [dispatch, queryClient, scheduleItemId, viewKey]
  );
}
