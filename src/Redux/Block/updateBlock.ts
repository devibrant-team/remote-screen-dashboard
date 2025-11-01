// src/ReactQuery/Schedule/useUpdateReservedBlock.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { SchedulePostPayload } from "./PostBlock";
import { UpdateReservedBlockApi } from "../../API/API";


// Response type (adjust if you know it)
export type UpdateReservedResponse = unknown;

/** Payload for update: must include id in the body */
export type UpdateReservedPayload = SchedulePostPayload & {
  id: string | number;
};

/** Low-level API call: PUT /:id with id also in body */
export async function updateReservedBlock(
  payload: UpdateReservedPayload
): Promise<UpdateReservedResponse> {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("token")) || null;

  const url = `${UpdateReservedBlockApi}/${payload.id}`; // URL includes id

  const { data } = await axios.post<UpdateReservedResponse>(url, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return data;
}

/** React Query mutation hook (same style as your post hook) */
export function useUpdateReservedBlock(opts?: {
  onSuccess?: (data: UpdateReservedResponse, vars: UpdateReservedPayload) => void;
  onError?: (err: unknown, vars: UpdateReservedPayload) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["update-reserved-block"],
    mutationFn: updateReservedBlock,
    onSuccess: async (data, vars) => {
      // Optional: invalidate queries after update
      // await qc.invalidateQueries({ queryKey: ["schedule-details"] });
      // await qc.invalidateQueries({ queryKey: ["schedule-list"] });
      // await qc.invalidateQueries({ queryKey: ["reservedBlocks"] });

      opts?.onSuccess?.(data, vars);
    },
    onError: (err, vars) => {
      opts?.onError?.(err, vars);
    },
  });
}
