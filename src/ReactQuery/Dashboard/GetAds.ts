// src/ReactQuery/Ads/GetAds.ts

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { GetAdsApi } from "../../API/API";

export type Ad = {
  id: number;
  media: string;
  media_type: "image" | "video" | string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type AdsResponse = {
  ads: Ad[];
};

export const ADS_QK = ["ads"] as const;

async function fetchAds(): Promise<Ad[]> {
  const token = localStorage.getItem("token");

  const res = await axios.get<AdsResponse>(GetAdsApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  return res.data?.ads ?? [];
}

export function useGetAds() {
  return useQuery<Ad[], Error>({
    queryKey: ADS_QK,
    queryFn: fetchAds,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
