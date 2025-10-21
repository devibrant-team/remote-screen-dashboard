import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { GetScheduleDetailsApi } from "../../API/API";
import type { ScheduleBlock } from "../../Redux/Schedule/SheduleSlice";

/** ----- API shapes (from your sample) ----- */
type ApiGroup = { groupId: number | string };
type ApiScreen = { screenId: number | string };
export type ApiScheduleItem = {
  id: number | string;
  groups?: ApiGroup[];
  startDate: string;   // "2025-10-18"
  endDate: string;     // "2025-10-24"
  startTime: string;   // "20:30:00"
  endTime: string;     // "23:00:00"
  screens?: ApiScreen[];
  // playlistId? ratio? (add if present)

};
type ApiResponse = {
  success: boolean;
  count: number;
  data: ApiScheduleItem[];
};

/** ----- helpers to convert API → Redux slice format ----- */
const ymdToDayFirst = (isoDate: string) => {
   const [y, m, d] = isoDate.split("-");
   return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
 };
function mapApiToScheduleBlocks(rows: ApiScheduleItem[]): ScheduleBlock[] {
  return rows.map((r) => {
    // your slice currently stores a SINGLE groupId (legacy). take first if multiple:
    const groupId = r.groups?.[0]?.groupId;
    return {
      id: String(r.id),
      title: `Block ${r.id}`, // change if API returns a title
      startDate: ymdToDayFirst(r.startDate),
      endDate: ymdToDayFirst(r.endDate),
      startTime: r.startTime, // already "HH:mm:ss"
      endTime: r.endTime,     // already "HH:mm:ss"
      groupId,
      // keep screens as [{screenId}]
      screens: (r.screens ?? []).map(s => ({ screenId: s.screenId })),
      // add playlistId/ratio if the API returns them
      // playlistId: r.playlistId,
      // ratio: r.ratio,
    };
  });
}

/** SSR-safe token */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/** ----- query fn ----- */
async function fetchScheduleDetails(): Promise<ScheduleBlock[]> {
  const token = getAuthToken();
  try {
    const res = await axios.get<ApiResponse>(GetScheduleDetailsApi, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const rows = res.data?.data ?? [];
    return mapApiToScheduleBlocks(rows);
  } catch (err) {
    const ax = err as AxiosError<any>;
    const msg =
      ax.response?.data?.message ||
      ax.response?.data?.error ||
      ax.message ||
      "Failed to fetch schedule details";
    throw new Error(msg);
  }
}

/** ----- exported hook ----- */
export function useGetScheduleDetails() {
  return useQuery({
    queryKey: ["schedule-details"],
    queryFn: fetchScheduleDetails,
    staleTime: 60_000, // 1 min (tweak as you like)
  });
}
export default fetchScheduleDetails;