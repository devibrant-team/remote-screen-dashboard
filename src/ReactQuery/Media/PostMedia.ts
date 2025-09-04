import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PostmediaApi } from "../../API/API"; // string endpoint

type UploadArgs = {
  files: File[];
  onProgress?: (percent: number) => void;
};

type UploadResponse = {
  success: boolean;
  message?: string;
};

function buildFormData(files: File[]): FormData {
  const form = new FormData();


  files.forEach((f, i) => {
    form.append(`media[${i}][file]`, f, f.name);
  });

  return form;
}

export function useUploadMedia() {
  const qc = useQueryClient();

  return useMutation<UploadResponse, unknown, UploadArgs>({
    mutationFn: async ({ files, onProgress }) => {
      const token = localStorage.getItem("token") ?? "";
      const form = buildFormData(files);

      const res = await axios.post<UploadResponse>(PostmediaApi, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (evt) => {
          if (!onProgress) return;
          const total = evt.total ?? 1;
          onProgress(Math.round((evt.loaded * 100) / total));
        },
      });

      return res.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "userMedia",
      });
    },
  });
}
