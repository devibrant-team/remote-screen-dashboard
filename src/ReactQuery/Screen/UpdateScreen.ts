// src/ReactQuery/Screen/UpdateScreen.ts
import axios from "axios";
import { UpdateScreen as UpdateScreenApi } from "../../API/API";

export type UpdateScreenPayload = {
  screenId: string | number; // 👈 use screenId for URL
  name: string;
  code: string;
  ratio_id: string | number | null;
  branch_id: string | number | null;
  group_id: string | number | null;
  playlist_id?: string | number | null;
};

export async function UpdateScreen(payload: UpdateScreenPayload) {
  const token = localStorage.getItem("token");

  const { screenId, ...body } = payload; // 👈 screenId in URL, rest in body

  const res = await axios.put(`${UpdateScreenApi}/${screenId}`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}
