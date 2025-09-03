// ReactQuery/Ratio/PostRatio.ts (aka hooks/useInsertRatio.ts)
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { insertRatioApi } from "../../API/API";

export type InsertRatioResponse = { id: string | null; ratio: string };
export type InsertRatioVars = {
  ratio: string;  // "16:9"
  num: number;    // 16
  den: number;    // 9
  width?: number | null;
  height?: number | null;
};

export function useInsertRatio(opts?: {
  onSuccess?: (created: InsertRatioResponse) => void;
  onError?: (err: unknown) => void;
}) {
  return useMutation<InsertRatioResponse, Error, InsertRatioVars>({
    mutationFn: async ({ ratio, num, den, width, height }) => {
      const token = localStorage.getItem("token");

      const body: Record<string, unknown> = {
        ratio,
        numerator: num,
        denominator: den,
      };
      if (width != null) body.width = width;
      if (height != null) body.height = height;

      const res = await axios.post(insertRatioApi, body, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 12000,
      });

      // Be lenient: support many possible shapes and don’t hard-fail on missing id
      const data = res.data ?? {};
      console.log("[useInsertRatio] response status:", res.status);
      console.log("[useInsertRatio] response data:", data);

      const id =
        data?.id ??
        data?.ratio?.id ??
        data?.data?.id ??
        null;

      const ratioStr =
        data?.ratio ??
        data?.ratio?.ratio ??
        data?.data?.ratio ??
        // Fall back to what we sent if backend doesn’t echo it back
        ratio;

      return { id: id != null ? String(id) : null, ratio: String(ratioStr) };
    },
    onSuccess: (created) => opts?.onSuccess?.(created),
    onError: (err) => {
      console.error("[useInsertRatio] error:", err);
      opts?.onError?.(err);
    },
  });
}
