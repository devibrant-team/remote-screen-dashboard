import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DeleteScreenApi } from "../../API/API";
import { SCREEN_OK } from "@/ReactQuery/Screen/GetScreen";
import { GROUP_OK } from "@/ReactQuery/Group/GetGroup";

type Vars = { screenId: string };

async function deleteScreen({ screenId }: Vars) {
  const token = localStorage.getItem("token") || "";
  const url = `${DeleteScreenApi}/${screenId}`;
  const res = await axios.delete(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

export function useDeleteScreen() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteScreen,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SCREEN_OK });
      qc.invalidateQueries({ queryKey: GROUP_OK});
    },
  });
}
