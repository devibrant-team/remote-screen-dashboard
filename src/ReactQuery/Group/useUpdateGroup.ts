// src/ReactQuery/Group/useUpdateGroup.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateGroup, type UpdateGroupPayload } from "./UpdateGroup";

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroupPayload) => UpdateGroup(payload),
    onSuccess: () => {
      // Refresh groups list after update
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
