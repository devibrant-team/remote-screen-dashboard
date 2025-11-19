import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { RenameBranchApi } from "../../API/API";
import { BRANCHES_QK } from "./GetBranch";

type Vars = { id: string; name: string };

async function renameBranch({ id, name }: Vars) {
  const token = localStorage.getItem("token") || "";
  const url = `${RenameBranchApi}/${id}`;
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

export function useRenameBranch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: renameBranch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BRANCHES_QK });
    },
  });
}
