// src/ReactQuery/Branch/useGetBranches.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { GetTagApi } from "../../API/API";

export type Tag = {
  id: number;
  name: string;
};

export const TAG_OK = ["tags"] as const;

async function fetchTag(): Promise<Tag[]> {
  const token = localStorage.getItem("token");

  const res = await axios.get(GetTagApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data?.tags ?? [];
}

export function useGetTags() {
  return useQuery<Tag[], Error>({
    queryKey: TAG_OK,
    queryFn: fetchTag,
    staleTime: 60 * 1000, // cache fresh for 1 min
    gcTime: 5 * 60 * 1000, // keep in cache for 5 min
    refetchOnWindowFocus: false,
  });
}
