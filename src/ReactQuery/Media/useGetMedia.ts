// src/hooks/media/useGetMedia.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getMediaUserApi } from "../../API/API";

export interface MediaItem {
  id: number;
  type: "image" | "video" | string;
  media: string; // absolute URL
}

export interface GetMediaResponse {
  success: boolean;
  media: MediaItem[];
}

type FetchArgs = {
  signal?: AbortSignal;
  token?: string | null;
};

export async function fetchUserMedia(
  { signal, token }: FetchArgs = {}
): Promise<MediaItem[]> {
  const { data } = await axios.get<GetMediaResponse>(getMediaUserApi, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!data?.success || !Array.isArray(data.media)) {
    throw new Error("Invalid media response");
  }
  return data.media;
}

const FIVE_MIN = 5 * 60 * 1000;


export function useGetMedia(requireAuth = true) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery({
    queryKey: ["userMedia", Boolean(token)],
    queryFn: ({ signal }) => fetchUserMedia({ signal, token }),
    enabled: requireAuth ? Boolean(token) : true,
    staleTime: FIVE_MIN,
    gcTime: FIVE_MIN,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Usage:
// const { data: media, isLoading, isError, error } = useGetMedia();

