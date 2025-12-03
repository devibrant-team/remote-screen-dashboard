// src/ReactQuery/Screen/AssignTag.ts
import axios from "axios";
import { AssignMediaToTagApi } from "../../API/API";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TAG_OK } from "./GetTag";
export type AssignTagForm = {
  tagId: number | null;
  tagText: string | null;
  media: { id: number | string }[];
};

export async function AssignTag(payload: AssignTagForm) {
  const token = localStorage.getItem("token");

  const res = await axios.put(AssignMediaToTagApi, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}
export function useAssignTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AssignTag,
    onSuccess: (_data, _variables) => {
      // 🔄 invalidate any queries affected by tag assignment
      queryClient.invalidateQueries({ queryKey: TAG_OK });
      queryClient.invalidateQueries({ queryKey: ["userMedia"] });
    },
  });
}
