// src/ReactQuery/Branch/useGetBranches.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getScreenApi } from "../../API/API";

export type Screen = {
  id: number;
  screenId: number;
  name: string;
  branch: string | null;
  ratio: string | null;
  ratioId: number | null;
  active: boolean;
  lastSeen: string | null;
  PlaylistId: number | null;
  PlaylistName: string | null;
  branchId: number | null;
  isOnline: boolean;
};

export const SCREEN_OK = ["screens"] as const;

async function fetchScreens(): Promise<Screen[]> {
  const token = localStorage.getItem("token");
  const res = await axios.get(getScreenApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

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
    isOnline: r.isOnline ?? false
  }));
}

export function useGetScreen() {
  return useQuery<Screen[], Error>({
    queryKey: SCREEN_OK,
    queryFn: fetchScreens,
    staleTime: 60 * 1000, // cache fresh for 1 min
    gcTime: 5 * 60 * 1000, // keep in cache for 5 min
    refetchOnWindowFocus: false,
  });
}
