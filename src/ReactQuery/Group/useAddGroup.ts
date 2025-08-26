// src/ReactQuery/Screen/useAddScreen.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddGroup, type AddGroupPayload } from "./PostGroup";

export function useAddGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddGroupPayload) => AddGroup(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}