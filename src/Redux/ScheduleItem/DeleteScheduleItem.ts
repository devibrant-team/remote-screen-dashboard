import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DeleteScheduleItem } from "../../API/API";


type Vars = { id: string };

async function deleteScheduleItem({ id }: Vars) {
  const token = localStorage.getItem("token") || "";
  const url = `${DeleteScheduleItem}/${id}`;
  const res = await axios.delete(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

export function useDeleteScheduleItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteScheduleItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduleItems"] });
    },
  });
}
