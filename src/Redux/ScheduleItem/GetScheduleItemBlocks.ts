// src/Redux/ScheduleItem/GetScheduleItemBlocks.ts
import { useQuery, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { GetScheduleItemBlocks } from "../../API/API";

export type ScheduleBlock = {
  id: number;
  playlistId: number;
  playlistName: string;
  screens: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
  start_day: string;
  start_time: string;
  end_day: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

export type BlocksApiResponse = {
  success: boolean;
  count: number;
  data: ScheduleBlock[];
};

/* ----------------------------- fetcher --------------------------- */
export async function fetchScheduleItemBlocks(
  id: string | number
): Promise<ScheduleBlock[]> {
  const token = localStorage.getItem("token") ?? "";
  const { data } = await axios.get<BlocksApiResponse>(
    `${GetScheduleItemBlocks}/${id}`,
    {
      headers: {
        // adjust if your backend expects another header key
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    }
  );
  return data?.data ?? [];
}

/* Optional: a helper to fetch + prime cache */
export async function primeScheduleItemBlocksCache(
  qc: QueryClient,
  id: string | number
): Promise<ScheduleBlock[]> {
  const blocks = await fetchScheduleItemBlocks(id);
  qc.setQueryData(["scheduleItemBlocks", id], blocks);
  
  return blocks;
}

/* ----------------------------- hook ------------------------------ */
export function useGetScheduleItemBlocks(selectedId: string | number | null | undefined) {
  return useQuery({
    queryKey: ["scheduleItemBlocks", selectedId],
    queryFn: () => fetchScheduleItemBlocks(selectedId as string | number),
    enabled: !!selectedId,
    staleTime: 30_000,
  });
}
