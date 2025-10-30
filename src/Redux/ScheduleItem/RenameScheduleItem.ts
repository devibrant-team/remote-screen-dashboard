import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { EditScheduleItem } from "../../API/API";


type Vars = { id: string; name: string };

async function renameScheduleItem({ id, name }: Vars) {
  const token = localStorage.getItem("token") || "";
  const url = `${EditScheduleItem}/${id}`;
  const res = await axios.put(
    url,
    { name },
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

export function useRenameScheduleItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: renameScheduleItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduleItems"] });
    },
  });
}
