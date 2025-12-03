import axios from "axios";
import { UpdateTagApi } from "../../API/API";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TAG_OK } from "./GetTag";
export type UpdateTagForm = {
  id: number;
  name: string;
};

export async function UpdateGroup(payload: UpdateTagForm) {
  const token = localStorage.getItem("token");
  const { id, name } = payload;
  const res = await axios.put(`${UpdateTagApi}/${id}`, {name}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTagForm) => UpdateGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAG_OK });
      queryClient.invalidateQueries({ queryKey: ["userMedia"] });

    },
  });
}
