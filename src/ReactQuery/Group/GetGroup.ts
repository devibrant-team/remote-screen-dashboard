// src/ReactQuery/Branch/useGetBranches.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getGroupApi } from "../../API/API";

export type Group = {
  id: number;
  name: string;
  branchName: string;
  ratio: string ;
  screenNumber: number;
};

export const GROUP_OK = ["groups"] as const;

async function fetchGroup(): Promise<Group[]> {
  const token = localStorage.getItem("token");

  const res = await axios.get(getGroupApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data?.groups ?? [];
}

export function useGetGroups() {
  return useQuery<Group[], Error>({
    queryKey: GROUP_OK,
    queryFn: fetchGroup,
    staleTime: 60 * 1000, // cache fresh for 1 min
    gcTime: 5 * 60 * 1000, // keep in cache for 5 min
    refetchOnWindowFocus: false,
  });
}
