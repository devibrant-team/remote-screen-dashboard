// src/Redux/Schedule/ScheduleItem/GetScheduleItemBlocks.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { GetScheduleItemBlocks } from "../../../API/API";

type RawScreen = { id: number | string; name: string };
type RawGroup  = { id: number | string; name: string };

type RawBlock = {
  id: number | string;
  playlistId: number | string;
  playlistName: string;
  screens: RawScreen[];
  groups: RawGroup[];
  start_day: string;  // "YYYY-MM-DD"
  start_time: string; // "HH:mm:ss"
  end_day: string;    // "YYYY-MM-DD"
  end_time: string;   // "HH:mm:ss"
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  success: boolean;
  count: number;
  data: RawBlock[];
};

export type ScheduleItemBlock = {
  id: string;
  title: string;          // playlistName
  playlistId: string;
  startDate: string;      // "YYYY-MM-DD"
  startTime: string;      // "HH:mm:ss"
  endDate: string;        // "YYYY-MM-DD"
  endTime: string;        // "HH:mm:ss"
  screens: Array<{ screenId: number }>;
  groups: Array<{ groupId: number }>;
};

const mapBlock = (b: RawBlock): ScheduleItemBlock => ({
  id: String(b.id),
  title: b.playlistName || `Playlist ${b.playlistId ?? ""}`,
  playlistId: String(b.playlistId ?? ""),
  startDate: b.start_day,
  startTime: b.start_time || "00:00:00",
  endDate: b.end_day,
  endTime: b.end_time || "00:00:00",
  screens: (b.screens ?? []).map((s) => ({ screenId: Number(s.id) })),
  groups: (b.groups ?? []).map((g) => ({ groupId: Number(g.id) })),
});

async function fetchScheduleItemBlocks(itemId: string): Promise<ScheduleItemBlock[]> {
  const token = localStorage.getItem("token") || "";
  const url = `${GetScheduleItemBlocks}/${itemId}`;
  const res = await axios.get<ApiResponse>(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const list = res.data?.data ?? [];
  return list.map(mapBlock);
}

export function useGetScheduleItemBlocks(itemId: string | null) {
  return useQuery({
    queryKey: ["scheduleItemBlocks", itemId],
    queryFn: () => fetchScheduleItemBlocks(itemId as string),
    enabled: !!itemId,
    staleTime: 15_000,
    gcTime: 300_000,
  });
}
