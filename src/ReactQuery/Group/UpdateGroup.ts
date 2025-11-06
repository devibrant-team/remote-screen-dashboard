import axios from "axios";
import { UpdateGroupApi } from "../../API/API";

export type UpdateGroupPayload = {
  id: number | null;
  name: string;
  ratioId?: number | null;
  branchId: number;
  assignScreens: { screenId: number }[];
  playlistId:number | null;
};

export async function UpdateGroup(payload: UpdateGroupPayload) {
  const token = localStorage.getItem("token");
  const { id, ...body } = payload;
  const res = await axios.put(`${UpdateGroupApi}/${id}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
