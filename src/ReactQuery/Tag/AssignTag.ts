// src/ReactQuery/Screen/UpdateScreen.ts
import axios from "axios";
import { AssignMediaToTagApi } from "../../API/API";

export type AssignTagForm = {
  tagId: number | null;
  tagText: string | null;
  media: { id: number | string }[];
};

export async function AssignTag(payload: AssignTagForm) {
  const token = localStorage.getItem("token");

  const res = await axios.put(AssignMediaToTagApi, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}
