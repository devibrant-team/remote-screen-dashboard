import axios from "axios";
import { AddScreenApi } from "../../API/API"; 

export type AddScreenPayload = {
  name: string;
  code: string;
  ratio_id: string | number | null;
  branch_id: string | number | null;
  group_id: string | number | null;
};

export async function AddScreen(payload: AddScreenPayload) {
  const token = localStorage.getItem("token");
  const res = await axios.post(AddScreenApi, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; 
}
