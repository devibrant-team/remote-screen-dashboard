import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DeleteBranchApi } from "../../API/API";
import { SCREEN_OK } from "@/ReactQuery/Screen/GetScreen";
import { GROUP_OK } from "@/ReactQuery/Group/GetGroup";
import { BRANCHES_QK } from "./GetBranch";

type Vars = { id: string };

async function deleteBranch({ id }: Vars) {
  const token = localStorage.getItem("token") || "";
  const url = `${DeleteBranchApi}/${id}`;
  const res = await axios.delete(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

export function useDeleteBranch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SCREEN_OK });
      qc.invalidateQueries({ queryKey: GROUP_OK});
      qc.invalidateQueries({ queryKey: BRANCHES_QK });
    },
  });
}
