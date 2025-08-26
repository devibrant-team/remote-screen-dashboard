// src/ReactQuery/Group/PostGroup.ts
import axios from "axios";
import { AddGroupApi } from "../../API/API";

export type AddGroupPayload = {
  name: string;
  ratioId: number;
  branchId: number;
  assignScreens: { id: number }[];
};

export async function AddGroup(payload: AddGroupPayload) {
  const token = localStorage.getItem("token");
  const res = await axios.post(AddGroupApi, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
