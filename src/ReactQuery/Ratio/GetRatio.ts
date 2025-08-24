// src/ReactQuery/Branch/useGetBranches.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getRatioApi } from "../../API/API";

export type Ratio = {
  id: number;
  ratio: string;
  numerator: number;
  denominator: number;
  width: number;
  height: number;
};

export const RATIO_QK = ["ratio"] as const;

async function fetchRatio(): Promise<Ratio[]> {
  const token = localStorage.getItem("token");

  const res = await axios.get(getRatioApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data?.ratio ?? [];
}

export function useGetRatio() {
  return useQuery<Ratio[], Error>({
    queryKey: RATIO_QK,
    queryFn: fetchRatio,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
  });
}
