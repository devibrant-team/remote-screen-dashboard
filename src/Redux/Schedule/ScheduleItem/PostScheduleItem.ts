import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { PostScheduleItem } from "../../../API/API";


export type PostScheduleItemPayload = {
  name: string;
};

export type PostScheduleItemResponse = {
  id?: number | string;
  name?: string;
  // ...whatever your API returns
};

async function postScheduleItemApi(
  payload: PostScheduleItemPayload,
  token?: string
): Promise<PostScheduleItemResponse> {
  const t =
    token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "");

  if (!t) {
    throw new Error("Missing auth token");
  }

  const res = await axios.post<PostScheduleItemResponse>(
    PostScheduleItem,
    payload,
    {
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

export function usePostScheduleItem() {
  return useMutation({
    mutationFn: ({
      name,
      token,
    }: PostScheduleItemPayload & { token?: string }) =>
      postScheduleItemApi({ name }, token),
  });
}
