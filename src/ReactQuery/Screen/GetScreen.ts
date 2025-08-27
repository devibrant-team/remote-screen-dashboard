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
  active: boolean;
  lastSeen: string | null;
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
  console.log("HAHA" ,raw )
  return raw.map((r: any) => ({
    id: r.id,
    screenId: r.screenId,
    name: r.screenName ?? "",
    branch: r.branchName ?? null,
    ratio: r.ratio ?? null, // no more trailing space
    active: Boolean(r.active), // 0/1 -> boolean
    lastSeen: r.lastSeen ?? null,
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
