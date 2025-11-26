// src/Redux/ScheduleItem/useScheduleItemBlocksByView.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import {
  type ScheduleBlock,
  type BlocksApiResponse,
} from "./GetScheduleItemBlocks";
import { GetScheduleItemBlocks } from "@/API/API";

export const SCHEDULE_ITEM_BLOCKS_BY_VIEW_QK = "scheduleItemBlocksByView";

type FetchParams = {
  scheduleItemId: string | number;
  start: string; // "YYYY-MM-DD"
  end: string;   // "YYYY-MM-DD"
};

/**
 * Fetch blocks for a schedule item LIMITED to a date range.
 * Backend should use ?start=YYYY-MM-DD&end=YYYY-MM-DD.
 */
async function fetchScheduleItemBlocksByView({
  scheduleItemId,
  start,
  end,
}: FetchParams): Promise<ScheduleBlock[]> {
  const token = localStorage.getItem("token") ?? "";

  const { data } = await axios.get<BlocksApiResponse>(
    `${GetScheduleItemBlocks}/${scheduleItemId}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
      params: {
        start, // e.g. "2025-11-29"
        end,   // e.g. "2025-12-06"
      },
    }
  );

  return data?.data ?? [];
}

/**
 * Uses:
 *  - calendarView (start/end/viewKey) from Redux
 *  - scheduleItem.id from Redux
 * Returns blocks for that visible range, cached by [id, viewKey].
 */
export function useScheduleItemBlocksByView() {
  const { start, end, viewKey } = useSelector(
    (s: RootState) => s.calendarView
  );

  const scheduleItemId = useSelector(
    (s: RootState) => s.ScheduleItem.id
  );

  const enabled =
    !!scheduleItemId && !!start && !!end && !!viewKey;

  return useQuery<ScheduleBlock[]>({
    queryKey: [SCHEDULE_ITEM_BLOCKS_BY_VIEW_QK, scheduleItemId, viewKey],
    enabled,
    queryFn: () =>
      fetchScheduleItemBlocksByView({
        scheduleItemId: scheduleItemId as string | number,
        start: start as string,
        end: end as string,
      }),
    staleTime: 5 * 60 * 1000,
  });
}
