// src/Redux/Schedule/ReservedBlocks/useDeleteReservedBlock.ts
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useDispatch } from "react-redux";

import { removeById } from "./ReservedBlockSlice";
import { DeleteReservedBlockApi } from "../../../API/API";

/** Pull token from storage safely (works in browser) */
function getAuthToken(): string | null {
  try {
    // adjust key name if yours differs (e.g., "access_token", "jwt")
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      null
    );
  } catch {
    return null;
  }
}

/** Server endpoint: DELETE {DeleteReservedBlockApi}/{id} (with Bearer token) */
async function deleteReservedBlockRequest(id: number | string) {
  const url = `${DeleteReservedBlockApi}/${id}`;
  const token = getAuthToken();

  // If your backend expects another header, change below (e.g., { headers: { token } })
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  // If your backend requires method override instead of DELETE:
  // return (await axios.post(url, { _method: "DELETE" }, { headers })).data;

  const res = await axios.delete(url, { headers });
  return res.data;
}

export function useDeleteReservedBlock() {
  const dispatch = useDispatch();

  return useMutation({
    mutationKey: ["reserved-block-delete"],
    mutationFn: (id: number | string) => deleteReservedBlockRequest(id),
    onSuccess: (_data, id) => {
      const n = Number(id);
      dispatch(removeById(Number.isFinite(n) ? n : (id as any)));
    },
  });
}
