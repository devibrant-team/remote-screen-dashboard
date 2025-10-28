// src/Redux/Schedule/ScheduleItem/PostScheduleItem.ts
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { PostScheduleItem } from "../../../API/API";

export type PostScheduleItemPayload = {
  name: string;
  // add more fields if needed
};

export type PostScheduleItemResponse = {
  success?: boolean;
  scheduleItemId?: number;
  schedule_item?: {
    id: number;
    name?: string;
    created_at?: string;
    updated_at?: string;
  };
};

export function usePostScheduleItem() {
  return useMutation<PostScheduleItemResponse, unknown, PostScheduleItemPayload>({
    mutationFn: async (payload) => {
      // ✅ Get token from localStorage
      const token = localStorage.getItem("token");

      // ✅ Send token in Authorization header
      const res = await axios.post(PostScheduleItem, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // conditional header
        },
      });

      // ✅ Always return the response body
      return res.data;
    },
  });
}
