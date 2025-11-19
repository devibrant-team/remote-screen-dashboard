// src/ReactQuery/Branch/GetBranchScreen.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { BranchScreenApi } from "../../API/API";
import type { Screen } from "../Screen/GetScreen";

export type IdLike = string | number;

// Helper to build query key
export const BRANCHSCREEN_QK = (branchId: IdLike | null) =>
  ["branchscreen", branchId] as const;

async function fetchBranchScreen(branchId: IdLike | null): Promise<Screen[]> {
  // if no branch selected → no request, return empty
  if (!branchId) return [];

  const token = localStorage.getItem("token");

  const res = await axios.get(
    `${BranchScreenApi}/${encodeURIComponent(String(branchId))}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  const raw = res.data?.screens ?? [];

  return raw.map((r: any) => ({
    id: r.id,
    screenId: r.screenId,
    name: r.screenName ?? "",
    branch: r.branchName ?? null,
    ratio: r.ratio ?? null,
    ratioId: r.ratioId,
    active: Boolean(r.active),
    lastSeen: r.lastSeen ?? null,
    PlaylistId: r.PlaylistId ?? null,
    PlaylistName: r.PlaylistName ?? null,
    branchId: r.branchId ?? null,
    group: r.groupName ?? null,
  }));
}

export function useGetBranchScreen(branchId: IdLike | null) {
  return useQuery<Screen[], Error>({
    queryKey: BRANCHSCREEN_QK(branchId),
    queryFn: () => fetchBranchScreen(branchId),
    enabled: !!branchId,            // 🔑 don't call until we have an ID
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
