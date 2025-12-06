// src/ReactQuery/Version/GetVersion.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { VersionApi } from "../../API/API";

export type BackendVersion = {
  version: string; // e.g. "0.0.1"
  versionType: number; // 1 = forced, 0 = optional
  link: string;
};

type VersionResponse = {
  success: boolean;
  version: string;
  versionType: number;
  link: string;
};

export const Version_OK = ["version"] as const;

async function fetchVersion(): Promise<BackendVersion> {
  const token = localStorage.getItem("token");

  const res = await axios.get<VersionResponse>(VersionApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  return {
    version: res.data.version,
    versionType: res.data.versionType,
    link: res.data.link,
  };
}

export function useGetVersion() {
  return useQuery<BackendVersion, Error>({
    queryKey: Version_OK,
    queryFn: fetchVersion,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
