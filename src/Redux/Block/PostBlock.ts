// src/ReactQuery/Schedule/usePostSchedule.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { postscheduleApi } from "../../API/API";
import { SCHEDULE_ITEM_BLOCKS_BY_VIEW_QK } from "../ScheduleItem/useScheduleItemBlocksByView";

/* --------------------------------- Types --------------------------------- */

// Reuse your existing item refs
export type ScreenRef = { screenId:number };
export type GroupRef  = { groupId:number };

// The body you already build in the sidebar
export type SchedulePostPayload = {
  title: string;
  playlistId: string;        // change to number if your backend expects number
  startDate: string;         // "DD-MM-YYYY"
  startTime: string;         // "HH:mm:ss"
  endDate: string;           // "DD-MM-YYYY"
  endTime: string;           // "HH:mm:ss"
  screens: ScreenRef[];
  groups: GroupRef[];
};

// What the API returns when you create/update a reserved block
// If you have a precise backend type, replace `unknown` with it
export type PostScheduleResponse = unknown;

// Variables passed into the mutation: URL id + body payload
export type PostScheduleVars = {
  scheduleItemId: string | number; // appended to URL as /:id
  payload: SchedulePostPayload;    // request body
};

/* ----------------------------- Low-level call ----------------------------- */

export async function postScheduleWithId(
  vars: PostScheduleVars
): Promise<PostScheduleResponse> {
  const { scheduleItemId, payload } = vars;

  if (scheduleItemId == null || scheduleItemId === "") {
    throw new Error("Missing scheduleItemId for postScheduleWithId");
  }

  const token =
    (typeof window !== "undefined" && localStorage.getItem("token")) || null;

  // e.g. postscheduleApi = "https://api.example.com/schedule"
  const url = `${postscheduleApi}/${scheduleItemId}`;

  const { data } = await axios.post<PostScheduleResponse>(url, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return data;
}

/* -------------------------- React Query mutation ------------------------- */

export function usePostSchedule(opts?: {
  onSuccess?: (data: PostScheduleResponse, vars: PostScheduleVars) => void;
  onError?: (err: unknown, vars: PostScheduleVars) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["post-schedule"],
    mutationFn: postScheduleWithId,
    onSuccess: (data, vars) => {
      // Invalidate anything you want refreshed after a successful post (optional)
      qc.invalidateQueries({ queryKey: [SCHEDULE_ITEM_BLOCKS_BY_VIEW_QK] });
      // qc.invalidateQueries({ queryKey: ["schedule-list"] });

      opts?.onSuccess?.(data, vars);
    },
    onError: (err, vars) => {
      opts?.onError?.(err, vars);
    },
  });
}
