import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import { DeleteTagApi } from "@/API/API";
import { TAG_OK } from "./GetTag";

export function useDeleteTag() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const mutation = useMutation({
    mutationFn: async (id: string | number) => {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${DeleteTagApi}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: TAG_OK });
           queryClient.invalidateQueries({ queryKey: ["userMedia"] });

        },
  });

  return {
    deleteTag: mutation.mutate, 
    deletingId,
  };
}
