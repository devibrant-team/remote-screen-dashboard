// src/ReactQuery/Schedule/GetScheduleBlocks.ts
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setReservedBlocks, type ScheduleBlock } from "../../Redux/Schedule/SheduleSlice";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export type ScheduleTargetsInput = {
  groups: Array<number | string>;
  screens: Array<number | string>;
};

type ApiScheduleItem = {
  id: number | string;
  title: string;
  playlistId?: number | string;
  groups?: Array<{ groupId: number | string }>;
  screens?: Array<{ screenId: number | string }>;
  startDate: string; // "2025-10-25"  (YYYY-MM-DD from backend)
  endDate: string;   // "2025-10-25"
  startTime: string; // "10:10:00"
  endTime: string;   // "11:10:00"
};

type ApiResponse = {
  success: boolean;
  from: string;
  to: string;
  count: number;
  data: {
    schedule: ApiScheduleItem[];
  };
};

// helper: convert "2025-10-25" -> "25-10-2025"
const ymdToDayFirst = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-");
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
};

export function useGetSchedulesByTargets() {
  const dispatch = useDispatch();

  return useMutation<ApiResponse, unknown, ScheduleTargetsInput>({
    mutationFn: async ({ groups, screens }) => {
      const groupsCsv = groups.join(",");
      const screensCsv = screens.join(",");

      const token = getAuthToken();

      const res = await axios.get<ApiResponse>(
        "https://srv1005364.hstgr.cloud/api/dashboard/schedules",
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: {
            groups: groupsCsv,
            screens: screensCsv,
          },
        }
      );

      return res.data;
    },

    onSuccess: (data) => {
      console.log("✅ GET /schedules response:", data);

      // Map API -> ScheduleBlock[]
      const normalized: ScheduleBlock[] =
        data?.data?.schedule?.map((item) => ({
          id: item.id,
          title: item.title,
          playlistId: item.playlistId,
          // convert YYYY-MM-DD -> DD-MM-YYYY because our reducer expects day-first
          startDate: ymdToDayFirst(item.startDate),
          endDate: ymdToDayFirst(item.endDate),
          startTime: item.startTime,
          endTime: item.endTime,
          screens: item.screens ?? [],
          groups: item.groups ?? [],
        })) ?? [];

      // shove them into Redux as reserved blocks
      dispatch(setReservedBlocks(normalized));
    },

    onError: (err) => {
      console.error("❌ GET /schedules failed:", err);
      // if request fails you can clear reserved if you want:
      dispatch(setReservedBlocks([]));
    },
  });
}
