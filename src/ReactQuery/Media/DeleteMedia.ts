import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import { DeletemediaApi } from "../../API/API";

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const mutation = useMutation({
    mutationFn: async (id: string | number) => {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${DeletemediaApi}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "userMedia",
      });
    },
  });

  return {
    deleteMedia: mutation.mutate, 
    deletingId,
  };
}
