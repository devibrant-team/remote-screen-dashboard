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
  // playlistId?: string | number;
  // ratio?: string;
};

type ApiResponse = {
  success: boolean;
  count: number;
  data: unknown; // backend is not always trustworthy, so mark as unknown
};

/** ----- helpers to convert API → Redux slice format ----- */
const ymdToDayFirst = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-");
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
};

// make this defensive
function mapApiToScheduleBlocks(
  rowsMaybe: unknown
): ScheduleBlock[] {
  // Force rows to be an array of objects we expect
  const rows = Array.isArray(rowsMaybe) ? rowsMaybe : [];

  return rows.map((r) => {
    const row = r as ApiScheduleItem;

    // your slice currently stores ONE groupId, we pick first
    const groupId = row.groups?.[0]?.groupId;

    return {
      id: String(row.id),
      title: `Block ${row.id}`, // adjust if API sends a real title/playlist name
      startDate: ymdToDayFirst(row.startDate),
      endDate: ymdToDayFirst(row.endDate),
      startTime: row.startTime,
      endTime: row.endTime,
      groupId,
      screens: (row.screens ?? []).map((s) => ({
        screenId: s.screenId,
      })),
      // playlistId: row.playlistId,
      // ratio: row.ratio,
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

    // res.data.data could be an array, OR an object, OR undefined
    const raw = res.data?.data;
    const blocks = mapApiToScheduleBlocks(raw);
    return blocks;
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
    staleTime: 60_000,
  });
}

export default fetchScheduleDetails;
