// src/ReactQuery/Branch/useGetBranches.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getBranchApi } from "../../API/API";

export type Branch = {
  id: number;
  name: string;
  user_id: number;
  created_at: string | null;
  updated_at: string | null;
};

export const BRANCHES_QK = ["branches"] as const;


async function fetchBranches(): Promise<Branch[]> {
  const token = localStorage.getItem("token"); 

  const res = await axios.get(getBranchApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data?.branches ?? [];
}

export function useGetBranches() {
  return useQuery<Branch[], Error>({
    queryKey: BRANCHES_QK,
    queryFn: fetchBranches,
    staleTime: 60 * 1000,       // cache fresh for 1 min
    gcTime: 5 * 60 * 1000,      // keep in cache for 5 min
    refetchOnWindowFocus: false,
  });
}
