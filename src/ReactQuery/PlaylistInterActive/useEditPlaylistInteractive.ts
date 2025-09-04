// src/ReactQuery/PlaylistInterActive/useUpdatePlaylistInteractive.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { editplaylistinteractiveApi } from "../../API/API";

export interface PlaylistResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Safely build the update URL.
 * If your constant already includes `:id` (e.g. "/api/interactive-playlists/:id"),
 * we'll replace it. Otherwise we append "/:id".
 */
function buildUpdateUrl(id: number) {
  if (!editplaylistinteractiveApi) {
    throw new Error("editplaylistinteractiveApi is not defined");
  }
  return editplaylistinteractiveApi.includes(":id")
    ? editplaylistinteractiveApi.replace(":id", String(id))
    : `${editplaylistinteractiveApi.replace(/\/$/, "")}/${id}`;
}

type UpdateArgs = {
  id: number;
  payload: FormData;
  /** Set to false if your API accepts a real PUT with multipart/form-data */
  useMethodOverride?: boolean; // default true (Laravel-friendly)
};

export const useUpdatePlaylistInteractive = () => {
  const queryClient = useQueryClient();
  // const token = localStorage.getItem("token");

  const updatePlaylist = async ({
    id,
    payload,
    useMethodOverride = true,
  }: UpdateArgs): Promise<PlaylistResponse> => {
    const url = buildUpdateUrl(id);
    const token = localStorage.getItem('token');
    // Many Laravel apps prefer POST + _method=PUT for multipart.
    if (useMethodOverride) {
      const fd = new FormData();
      // clone entries to avoid mutating the original FormData
      payload.forEach((v, k) => fd.append(k, v));
      fd.append("_method", "post");

      const res = await axios.post(url, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    }

    // If your backend supports real PUT with multipart/form-data:
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  };

  return useMutation({
    mutationFn: updatePlaylist,
    onSuccess: (_, variables) => {
      // Invalidate the list and the details of this playlist
      queryClient.invalidateQueries({ queryKey: ["interactiveplaylist"] });
      queryClient.invalidateQueries({
        queryKey: ["interactiveplaylist", "details", variables.id],
      });
    },
  });
};
