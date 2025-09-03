import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import { deletePlaylistApi } from "../../API/API"; 

export function useDeleteNormalPlaylist() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const mutation = useMutation({
    mutationFn: async (id: string | number) => {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `${deletePlaylistApi}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey.some((k) =>
            typeof k === "string" ? /normal|playlist/i.test(k) : false
          ),
      });
    },
  });

  return {
    deletePlaylist: mutation.mutate,
    deletingId,
  };
}
