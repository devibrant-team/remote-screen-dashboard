import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { DeleteGroupApi } from "../../API/API";

async function deleteGroup(groupId: number): Promise<void> {
  const token = localStorage.getItem("token");

  await axios.delete(`${DeleteGroupApi}/${groupId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
}

export function useDeleteGroup() {
  return useMutation<void, unknown, number>({
    mutationFn: deleteGroup,
  });
}
