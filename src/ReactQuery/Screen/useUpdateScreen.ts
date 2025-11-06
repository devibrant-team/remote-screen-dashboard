// src/ReactQuery/Screen/useUpdateScreen.ts
import { useMutation } from "@tanstack/react-query";
import { UpdateScreen, type UpdateScreenPayload } from "./UpdateScreen";

export const useUpdateScreen = () =>
  useMutation({
    mutationFn: (payload: UpdateScreenPayload) => UpdateScreen(payload),
  });
