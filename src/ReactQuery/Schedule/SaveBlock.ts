// src/ReactQuery/Schedule/SaveBlock.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { postscheduleApi } from "../../API/API";

/** Type of the block as it is in Redux (your structure) */
export type ScheduleBlockDTO = {
  id: string;
  title: string;
  startDate: string; // "18-10-2025" (day-first)
  endDate: string;   // "18-10-2025"
  startTime: string; // "8:00:00"
  endTime: string;   // "9:00:00"
  ratio?: string;
  playlistId?: string | number;
  groupId?: number | string;
  screens?: Array<{ screenId: number | string }>;
};

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

async function postScheduleBlock(block: ScheduleBlockDTO) {
  const payload = {
    ...block,
    screens: block.screens ?? [],
  };

  const token = getAuthToken();

  try {
    const res = await axios.post(postscheduleApi, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    // axios returns parsed JSON in res.data
    return res.data as { ok?: true; id?: string } | ScheduleBlockDTO;
  } catch (err) {
    const ax = err as AxiosError<any>;
    // Prefer server-provided message if available
    const serverMsg =
      ax.response?.data?.message ||
      ax.response?.data?.error ||
      ax.response?.data?.msg;
    const status = ax.response?.status;
    const fallback = ax.message || "Request failed";
    throw new Error(serverMsg ? `${serverMsg}` : status ? `Save failed (${status})` : fallback);
  }
}

export function useSaveScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["save-schedule-block"],
    mutationFn: postScheduleBlock,
    onSuccess: () => {
      // Invalidate any queries that should refresh after saving
      qc.invalidateQueries({ queryKey: ["schedule-blocks"] });
    },
  });
}
