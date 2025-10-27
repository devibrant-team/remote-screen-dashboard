// src/ReactQuery/Schedule/usePostSchedule.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { postscheduleApi } from "../../API/API";

// ---- Types from your schedule slice (trimmed to what we post) ----
export type ScreenRef = { screenId: number };
export type GroupRef  = { groupId: number };

export type SchedulePostPayload = {
  title: string;
  playlistId: string;        // if your backend expects number, change to number
  startDate: string;         // "DD-MM-YYYY" (match what you already use)
  startTime: string;         // "HH:mm:ss"
  endDate: string;           // "DD-MM-YYYY"
  endTime: string;           // "HH:mm:ss"
  screens: ScreenRef[];
  groups: GroupRef[];
};

// Replace this with your API’s actual response type if you know it
export type PostScheduleResponse = unknown;

/** Low-level API call */
export async function postSchedule(payload: SchedulePostPayload): Promise<PostScheduleResponse> {
  const token = (typeof window !== "undefined" && localStorage.getItem("token")) || null;

  const { data } = await axios.post<PostScheduleResponse>(postscheduleApi, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return data;
}

/** React Query mutation hook */
export function usePostSchedule(opts?: {
  onSuccess?: (data: PostScheduleResponse, vars: SchedulePostPayload) => void;
  onError?: (err: unknown, vars: SchedulePostPayload) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["post-schedule"],
    mutationFn: postSchedule,
    onSuccess: (data, vars) => {
      // Invalidate anything that should refresh after posting (optional):
      // qc.invalidateQueries({ queryKey: ["schedule-details"] });
      // qc.invalidateQueries({ queryKey: ["schedule-list"] });

      opts?.onSuccess?.(data, vars);
    },
    onError: (err, vars) => {
      opts?.onError?.(err, vars);
    },
  });
}
