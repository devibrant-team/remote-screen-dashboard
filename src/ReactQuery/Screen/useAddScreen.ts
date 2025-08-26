// src/ReactQuery/Screen/useAddScreen.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddScreen } from "./PostScreen";
import type {AddScreenPayload} from "./PostScreen";
import { SCREEN_OK } from "./GetScreen";
export function useAddScreen() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddScreenPayload) => AddScreen(payload),
    onSuccess: (_data) => {
      qc.invalidateQueries({ queryKey: [SCREEN_OK] }); 
    },
  });
}
